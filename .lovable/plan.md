

# Fix Notifications Bugs

## Summary
Four bugs need to be fixed across the notifications system: a schema mismatch in the UI, duplicate manual notification inserts, a missing RLS DELETE policy, and conflicting real-time channel names.

---

## Changes

### 1. Update Notification UI to use `title`/`body` instead of `content`
The database `notifications` table has `title` and `body` columns but no `content` column. The UI currently references `notification.content`.

**File: `src/hooks/useNotifications.ts`**
- Update the `Notification` interface: replace `content: string` with `title: string | null` and `body: string | null`

**File: `src/pages/Notifications.tsx`**
- Line 219: Change `notification.content` to display `notification.title` (as a bold heading) and `notification.body` (as the description text), with fallbacks for either being null

### 2. Remove duplicate manual notification inserts from `useConnections.ts`
Database triggers `notify_on_connection_request()` and `notify_on_connection_accept()` already handle creating notifications automatically. The manual inserts duplicate them and also use the wrong column name (`content` instead of `title`/`body`).

**File: `src/hooks/useConnections.ts`**
- Lines 46-52 (`useSendConnectionRequest`): Remove the manual `supabase.from("notifications").insert(...)` block
- Lines 94-100 (`useAcceptConnectionRequest`): Remove the manual `supabase.from("notifications").insert(...)` block

### 3. Add DELETE RLS policy for notifications
The `notifications` table currently has no DELETE policy, so `useDeleteNotification` will silently fail.

**Database migration:**
```sql
CREATE POLICY "Users can delete their own notifications"
ON public.notifications
FOR DELETE
USING (auth.uid() = user_id);
```

### 4. Fix duplicate real-time channel names
Both `useNotifications` and `useUnreadNotificationCount` subscribe to a channel named `"notifications"`, causing conflicts.

**File: `src/hooks/useNotifications.ts`**
- Line 49: Keep channel name as `"notifications"` for `useNotifications`
- Line 101: Change channel name to `"notifications-unread-count"` for `useUnreadNotificationCount`

---

## Technical Details

| Bug | File(s) | Lines |
|-----|---------|-------|
| Schema mismatch (`content` vs `title`/`body`) | `useNotifications.ts`, `Notifications.tsx` | Interface + line 219 |
| Duplicate notification inserts | `useConnections.ts` | Lines 46-52, 94-100 |
| Missing DELETE RLS policy | Database migration | New policy |
| Channel name collision | `useNotifications.ts` | Lines 49, 101 |

