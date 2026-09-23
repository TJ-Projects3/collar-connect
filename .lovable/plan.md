# @Mentions in Posts, Comments and Messages

Let people tag someone by typing `@`, pick them from a live suggestion list, and have the tagged person get a notification that links straight to the post or chat. Group chat is out of scope for this plan.

## What the user sees

1. Typing `@` in the post box, a comment box, or the message box opens a small suggestion list under the cursor.
2. The list searches people by name as you keep typing. Your connections appear first, everyone else below under a divider.
3. Arrow keys move through the list, Enter or Tab or a click inserts the person. Escape closes it.
4. Once inserted, the name shows as a highlighted tag in the finished post, comment, or message and links to that person's profile.
5. The tagged person's notification bell updates immediately with "Isaiah mentioned you in a post" and opens the exact post, comment, or conversation when clicked.
6. Someone you have blocked (or who blocked you) never receives a mention notification, and you cannot tag yourself into a notification.

## How mentions are stored

Text is saved with an inline marker: `@[Full Name](user-uuid)`. Plain text stays readable everywhere, and the display layer turns each marker into a clickable name. Nothing already posted changes.

## Technical details

Database (one migration):
- `notify_mentions(_content text, _author uuid, _kind text, _ref uuid, _secondary uuid)` — `SECURITY DEFINER`, `SET search_path = public, pg_temp`, extracts UUIDs from the `@[...](uuid)` markers with `regexp_matches`, filters out the author, non-existent profiles and `is_blocked` pairs, and inserts one `notifications` row per target with `type = 'mention'`, `sender_id = _author`, `reference_id`, `secondary_reference_id`. Client insert into `notifications` is blocked by RLS, so this definer path is required.
- Three AFTER INSERT triggers calling it: `posts` (ref = post id), `post_replies` (ref = post_id, secondary = reply id), `messages` (ref = conversation_id, target restricted to the existing recipient so DM mentions cannot notify outsiders).
- No new table, no new column, no policy loosened.

Frontend:
- `src/hooks/useMentionSearch.ts` — debounced `profiles` name search plus connection IDs from `useConnections`, returning connections-first ordered results.
- `src/components/mentions/MentionTextarea.tsx` — reusable controlled textarea that detects the active `@token` before the caret, renders the suggestion popover, handles keyboard navigation, and replaces the token with the marker on select. Used by `CreatePostModal`, `CommentInput`, `ReplyModal` and the Messages composer so behaviour is identical everywhere.
- `src/lib/post-formatting.tsx` / `LinkifyText` — render `@[Name](uuid)` as a `Link` to `/profile?userId=uuid` styled with the primary token; applied to posts, replies and message bubbles.
- `useNotifications.ts` — add `mention` to `notificationLink`: post/comment mentions deep-link to `/feed?post=...&reply=...`, message mentions to `/messages?recipientId=...`. Existing realtime subscription already refreshes the bell.

Verification: sign in, tag a second account from a post, a comment and a DM, and confirm the marker renders as a link and the target account's bell shows the mention with a working deep link.
