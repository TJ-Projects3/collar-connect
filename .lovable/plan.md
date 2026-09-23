# Group Chats in Messages

Turn messaging from strictly one-to-one into conversation-based chats that can hold many people, while keeping every existing direct message working exactly as it does today.

## What you'll be able to do

- Start a new chat and pick more than one person (from your connections), give the group a name, and optionally a group picture.
- See groups in the Recent Chats list with the group name and a stacked/初 group avatar, alongside your one-to-one chats.
- Open a group, see who said what (each message shows the sender's name and avatar), and send messages with the same composer, mentions, and GIF support.
- Open a group's member list to add connections, remove members, rename the group, leave the group, or promote another member to admin.
- Group creators and promoted admins can rename, add, remove, and promote; regular members can only send messages and leave.
- Everyone in a group gets a notification (and email, per their preferences) for new group messages, exactly like direct messages.

## Approach

Conversations and participants tables already exist and back today's direct messages, so this is an extension rather than a rebuild. The main shift: messages stop being addressed to one person and become owned by a conversation, and permission to read a chat comes from being a participant.

## Technical plan

### Database

1. `conversations`: add `title text`, `is_group boolean not null default false`, `avatar_url text`, `created_by uuid`. Keep `conversation_key` (unique pair key) for direct chats; it stays null for groups.
2. `conversation_participants`: add `role text not null default 'member'` (check: `admin`/`member`) and `joined_at timestamptz not null default now()` (keep existing `created_at`). Primary/unique key on `(conversation_id, user_id)`.
3. `messages.recipient_id`: make nullable (null for group messages). Do not drop it — direct-message read state, blocking checks, and existing rows depend on it. `conversation_id` stays required and becomes the authoritative scope.
4. Helper `public.is_conversation_member(_conversation_id uuid, _user_id uuid)` and `public.is_conversation_admin(...)`, both SECURITY DEFINER, `SET search_path = public, pg_temp`, to avoid recursive policy evaluation.
5. RLS rewrite, membership-based:
   - `messages` select/insert: membership via `is_conversation_member(conversation_id, auth.uid())`; insert also requires `sender_id = auth.uid()`, not `recruiter_blocked`, and for direct chats the existing `is_blocked` check.
   - `conversations` select: membership; update: admins only.
   - `conversation_participants` select: rows of conversations you belong to (so member lists render); insert/delete/update: admins of that conversation, plus self-removal (leave) and self-insert for the direct-chat path.
   - Collapse today's duplicate participant policies (three overlapping select policies) into one.
6. RPCs (SECURITY DEFINER, `search_path = public, pg_temp`), each validating `auth.uid()`:
   - `create_group_conversation(title, participant_ids uuid[], avatar_url)` — caller becomes admin, participants must be accepted connections of the caller, minimum 2 others, cap group size (e.g. 50).
   - `send_group_message(conversation_id, content)` — membership + recruiter-block checks, inserts message with null `recipient_id`, updates `last_message`.
   - `add_group_participants`, `remove_group_participant`, `leave_group`, `set_participant_role`, `rename_group` — admin-gated (self-removal allowed for leave).
   - `send_dm` stays as-is for one-to-one chats.
7. Notifications: replace the single-recipient message trigger with one that fans out a row per other participant for group messages (type `message`, `reference_id = conversation_id`), keeping direct-message behavior identical. Reuse existing email dispatch.
8. Mention trigger on `messages`: allow mention notifications for any participant of the conversation instead of only `recipient_id`.

### Frontend

- `src/hooks/useMessaging.ts`: rekey everything on `conversation_id`. `useConversations` reads from `conversations` + participants (title/avatar for groups, counterpart profile for direct), `useConversationMessages(conversationId)` fetches by conversation, realtime filters on `conversation_id`, `useSendMessage` routes to `send_dm` or `send_group_message`.
- New `src/hooks/useGroupChat.ts` for create/add/remove/leave/rename/promote mutations with cache invalidation.
- New `src/components/messages/NewChatModal.tsx` with multi-select connection picker (search, chips), group name field when 2+ selected, and single-select falling through to the existing DM flow.
- New `src/components/messages/GroupMembersSheet.tsx` for member list, role badges, and admin actions.
- `src/pages/Messages.tsx`: route on `?conversationId=`, keep `?recipientId=` working by resolving it to the direct conversation; show sender name/avatar on group messages; header shows group title, member count, and the members button.
- Entry points that deep-link into messaging (Profile, MyNetwork, CandidateCard, mentorship modal, notifications) keep using `?recipientId=` and need no change.

### Verification

- Confirm existing direct chats still list, open, and send after the schema change.
- Create a group, send from two accounts, confirm both see the message and each non-sender gets a notification.
- Confirm a non-member cannot read the group's messages or participant rows.
