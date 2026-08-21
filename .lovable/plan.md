# Notification management controls

## Current state (verified)
- The navbar popover header already has a "Mark all as read" button wired to the bulk update, and the red badge clears from the unread-count query.
- Clicking a row already marks the group read and deep-links to the post, reply, or message thread.
- Rows show a faint highlight plus a dot when unread, but there are no per-row hover actions and the read state isn't visually distinct enough.
- The full Notifications page auto-marks everything read the moment it loads, so per-item read/unread controls there would be meaningless.

## What to build

### 1. Per-row hover actions (dropdown + page)
In the notification row component, add a right-side action cluster that appears on hover (and is always visible on touch/mobile):
- A small dot toggle: marks an unread group read, or marks a read group unread again.
- A dismiss (X) button that deletes the notifications in that group and removes the row.
Both actions stop click propagation so they don't trigger navigation.

### 2. Clearer read vs unread styling
- Unread: subtle primary-tinted background, medium-weight text, blue dot.
- Read: plain background, muted text, no dot.

### 3. Empty state with checkmark
Replace the plain text empty state with a centered check-circle icon plus "You're all caught up!" and "No new notifications." Use the same treatment in the popover and on the full page card.

### 4. Notifications page behavior
Stop auto-marking everything read on page load so unread state survives long enough to manage. Keep the header "Mark all as read" button as the explicit action.

## Technical notes
- New mutations in `src/hooks/useNotifications.ts`: mark a group unread (`is_read = false` for a set of ids) and delete a group of ids; both invalidate the notifications list and unread-count keys.
- Row markup, hover actions, and the empty state live in `src/components/notifications/NotificationList.tsx`.
- `src/pages/Notifications.tsx`: drop the auto-mark-read effect.
- No database or RLS changes needed — existing policies already allow the owner to update and delete their own notifications.
