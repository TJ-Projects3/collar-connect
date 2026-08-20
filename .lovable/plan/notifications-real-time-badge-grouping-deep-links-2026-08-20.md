# Notifications: real-time badge, grouping, deep links

## What's happening today

- The bell is a plain link to `/notifications` with an unread badge. The hook already subscribes to Realtime, but the `notifications` table is **not** in the `supabase_realtime` publication (verified), so no change events are ever delivered — the badge only updates on refetch/reload.
- Like and reply notifications both store only the **post id** in `reference_id` (verified in the trigger functions). Reply notifications carry no reply id, so an exact-reply deep link isn't possible yet.
- There is no notification dropdown; "Mark all as read" only exists on the `/notifications` page.

## What we'll build

**1. Instant badge updates**
Enable Realtime on `notifications` so inserts/updates for the logged-in user stream in and the badge count increments without reload.

**2. Notification dropdown on the bell**
Clicking the bell opens a dropdown with the most recent notifications (sender avatar, grouped text, relative time), a "Mark all as read" button at the top, and a "See all notifications" link to `/notifications`. The bell stays a link target on mobile-sized screens where a dropdown is cramped.

**3. Grouped likes**
Consecutive like notifications on the same post collapse into one row: "Sarah and 2 others liked your post", using the most recent timestamp and stacked avatars. Marking the group read marks every underlying notification read. Grouping is applied in both the dropdown and the `/notifications` page.

**4. Deep-link and focus**
Clicking a notification navigates to the feed with the target post, scrolls smoothly to it and briefly highlights it. For reply notifications the post's replies auto-expand and the specific reply is scrolled to and highlighted.

## Technical notes

Database migration:
- `ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;` (plus `REPLICA IDENTITY FULL`).
- Add `notifications.secondary_reference_id uuid` and update `notify_on_post_reply()` to store `NEW.id` (the reply id) there so replies can be focused exactly. Existing rows keep post-level linking.

Frontend:
- `src/hooks/useNotifications.ts`: add `secondary_reference_id` to the type, add a `groupNotifications` helper (consecutive same-type + same `reference_id` like rows → one group with `senders[]` and `ids[]`), and a `useMarkNotificationsRead` mutation that accepts an id array.
- `src/components/Navbar.tsx`: replace the `NotificationBell` link with a `Popover` containing the dropdown list, "Mark all as read", and per-item click handling; keep the badge behaviour.
- New `src/components/notifications/NotificationList.tsx` shared by the dropdown and `/notifications` so grouping/labels/icons live in one place.
- Deep-link contract: `/feed?post=<postId>&reply=<replyId>`. `src/pages/Feed.tsx` adds `id={`post-${post.id}`}` anchors, reads the params, scrolls with `scrollIntoView({ behavior: "smooth", block: "center" })` and applies a temporary ring highlight. `InlineReplies` gains `defaultExpanded` / `focusReplyId` props; replies get `id={`reply-${reply.id}`}` anchors and the same highlight treatment.
- `src/pages/Notifications.tsx` switches to the shared grouped list and keeps its auto-mark-read behaviour.
