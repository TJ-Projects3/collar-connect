# Notification Bulk Actions

## Goal
Add explicit bulk actions to the Notifications popover and the `/notifications` page so users can mark everything read or clear every notification in one click.

## Current State
- `useMarkAllNotificationsRead()` already exists and is wired in `Navbar.tsx` and `Notifications.tsx`.
- `useDeleteNotifications()` exists for deleting a single grouped row.
- There is no bulk "Clear all" (delete all) action.

## Plan

1. **Add a bulk-delete hook**
   - Create `useClearAllNotifications()` in `src/hooks/useNotifications.ts`.
   - It deletes every `notifications` row where `user_id = currentUser.id`.
   - On success, invalidate `notifications` and `notifications-unread-count` queries.

2. **Popover header (`Navbar.tsx`)**
   - Keep the existing "Mark all as read" text button.
   - Add a separate "Clear all" text button next to it, visible when there are notifications.
   - Clicking "Clear all" opens a confirmation alert-dialog before deleting.

3. **Full page (`Notifications.tsx`)**
   - In the top-right action area, show both:
     - "Mark all as read" (existing, disabled when nothing is unread).
     - "Clear all" (opens confirmation, disabled when no notifications exist).
   - After clearing, the page shows the existing "You're all caught up!" empty state.

4. **Confirmation dialog**
   - Use the existing `AlertDialog` component (or `Dialog` if unavailable) to ask: "Clear all notifications? This cannot be undone."
   - Confirm triggers the delete mutation; cancel closes the dialog.

5. **Verify UX**
   - Ensure the red unread badge disappears immediately after "Mark all as read".
   - Ensure the dropdown list reflects the cleared/deleted state without a manual refresh.

## Files to Change
- `src/hooks/useNotifications.ts`
- `src/components/Navbar.tsx`
- `src/pages/Notifications.tsx`
