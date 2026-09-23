# Fix stale previews in Recent Chats

## What's wrong

The chat list doesn't read the actual newest message. It reads a summary line stored on the conversation record, which is written when a message is sent but never corrected when a message is later removed.

Confirmed in the database: one conversation shows the preview "dm regression check" dated 01:08, while its real newest message is "testing to see if you get this notification in email" from 23:06 the previous evening. That test message was deleted, and the leftover summary line stayed behind. The same gap means a preview can show a message the user deleted on their side.

## The fix

Have the Recent Chats list read the preview straight from the messages themselves:

- For each of the user's conversations, fetch the newest message and use its text and time as the preview.
- Skip messages the user has deleted on their side, so previews never show removed text.
- Sort the list by that real newest message time, so ordering matches the previews.
- Conversations with no messages left show no preview text instead of an old one.

Also clean the existing records so the stored summary lines match reality (and clear them where the conversation has no messages), which keeps notifications and anything else reading that field correct.

## Technical notes

- `src/hooks/useMessaging.ts` → `useConversations`: after loading the user's `conversation_participants` rows, fetch messages for those `conversation_id`s (`id, conversation_id, sender_id, content, created_at, sender_deleted, recipient_deleted`) ordered by `created_at desc`, and reduce to the first row per conversation, excluding rows the current user soft-deleted (own message with `sender_deleted`, received message with `recipient_deleted`). Build `last_message` from that row instead of `conversations.last_message/last_message_at`, and sort summaries by it.
- Keep selecting `conversations` for `is_group`, `title`, `avatar_url`, `created_by`; drop reliance on its `last_message*` columns for display.
- Realtime already invalidates `["conversations", userId]` on message insert, so previews stay live; no trigger changes needed.
- One-off migration to resync `conversations.last_message` / `last_message_at` from the latest row in `messages` per conversation, nulling both when no messages exist.
