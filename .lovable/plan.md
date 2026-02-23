

# Connections Feature - LinkedIn-Style Implementation

## Summary
Implement a full connections system with connection counts on profiles, Accept/Reject buttons on profile pages for incoming requests, and Connect/Connected status buttons on My Network cards. This also includes backend fixes for broken foreign keys and database triggers.

---

## Phase 1: Backend Fixes

### 1.1 Fix foreign keys on `user_connections`
The `requester_id` and `receiver_id` columns currently reference `auth.users(id)` instead of `public.profiles(id)`. PostgREST cannot join to `auth.users`, which means all connection queries that try to fetch profile data via joins silently fail. We need to drop the existing foreign keys and re-create them pointing to `profiles(id)`.

**Database migration:**
```sql
ALTER TABLE public.user_connections
  DROP CONSTRAINT user_connections_requester_id_fkey,
  DROP CONSTRAINT user_connections_receiver_id_fkey;

ALTER TABLE public.user_connections
  ADD CONSTRAINT user_connections_requester_id_fkey
    FOREIGN KEY (requester_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
  ADD CONSTRAINT user_connections_receiver_id_fkey
    FOREIGN KEY (receiver_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
```

### 1.2 Fix notification triggers using wrong column
The `notify_on_connection_request()` and `notify_on_connection_accept()` triggers insert into a `content` column that does not exist on the `notifications` table. They need to use `title` and `body` instead.

**Database migration:**
```sql
CREATE OR REPLACE FUNCTION public.notify_on_connection_request()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
begin
  insert into public.notifications (user_id, sender_id, type, title, body, reference_id)
  values (
    NEW.receiver_id,
    NEW.requester_id,
    'connection_request',
    'Connection Request',
    'You received a new connection request',
    NEW.id
  );
  return NEW;
end;
$$;

CREATE OR REPLACE FUNCTION public.notify_on_connection_accept()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
begin
  if NEW.status = 'accepted' and OLD.status = 'pending' then
    insert into public.notifications (user_id, sender_id, type, title, body, reference_id)
    values (
      NEW.requester_id,
      NEW.receiver_id,
      'connection_accepted',
      'Connection Accepted',
      'Your connection request was accepted',
      NEW.id
    );
  end if;
  return NEW;
end;
$$;
```

---

## Phase 2: Frontend Changes

### 2.1 Add `useConnectionCount` hook
**File: `src/hooks/useConnections.ts`**
- Add a new `useConnectionCount(userId)` hook that queries `user_connections` for accepted connections where the user is either requester or receiver, using `select("*", { count: "exact", head: true })` for efficiency.

### 2.2 Update `useConnectionStatus` to include receiver_id
**File: `src/hooks/useConnections.ts`**
- Add `receiver_id` to the select so the profile page can determine if the current user is the receiver (and thus can accept the request).

### 2.3 Profile page: Connection count + Accept/Reject buttons
**File: `src/pages/Profile.tsx`**

- **Connection count**: Display "X connections" below the user's name/headline, styled as a clickable link to `/my-network` (like LinkedIn).
- **Accept/Reject buttons**: When viewing another user's profile and there is a pending incoming request (where the current user is the `receiver_id`), replace the "Connect" button with "Accept" and "Ignore" buttons. Use the existing `useAcceptConnectionRequest` and `useRejectConnectionRequest` hooks.

The button states will be:
| Scenario | Button(s) Shown |
|---|---|
| No connection exists | "Connect" button |
| Current user sent pending request | "Pending" (disabled) |
| Other user sent pending request to current user | "Accept" + "Ignore" buttons |
| Already connected | "Connected" (disabled outline) |

### 2.4 Profile page: Fix ConnectionsSidebar
**File: `src/pages/Profile.tsx`**

The sidebar currently shows random profiles instead of actual connections. It will be updated to:
- Use `useMyConnections` to fetch real accepted connections
- Display the connected user's profile (determine which side of the connection is the "other" user)
- Show count in the sidebar header: "Connections (X)"

### 2.5 My Network page: Add Connect/Connected buttons
**File: `src/pages/MyNetwork.tsx`**

Each user card will get a connection action button alongside the existing "Message" button. A new `ConnectionButton` component will be created within this file that:
- Uses `useConnectionStatus` to check the relationship with each user
- Shows "Connect", "Pending", "Accept", or "Connected" based on status
- Calls `useSendConnectionRequest`, `useAcceptConnectionRequest` as needed

### 2.6 Remove `as any` type casts
**File: `src/hooks/useConnections.ts`**

After the foreign key migration, PostgREST joins will work. Remove `as any` casts from `supabase.from("user_connections" as any)` calls and update the queries to use proper joins for profile data where needed.

---

## Technical Details

### Files to modify:
| File | Changes |
|---|---|
| `src/hooks/useConnections.ts` | Add `useConnectionCount`, update `useConnectionStatus` to include `receiver_id`, remove `as any` casts |
| `src/pages/Profile.tsx` | Add connection count display, Accept/Reject buttons for incoming requests, fix ConnectionsSidebar to use real connections |
| `src/pages/MyNetwork.tsx` | Add Connect/Connected button to each user card |
| Database (2 migrations) | Fix foreign keys on `user_connections`, fix notification trigger functions |

### Query invalidation
Accepting/rejecting connections already invalidates `["connections"]`, `["pending-connections"]`, and `["notifications"]` query keys. The new `useConnectionCount` will use `["connection-count", userId]` and will also be invalidated on accept.

