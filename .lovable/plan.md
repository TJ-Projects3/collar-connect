
# Messaging Feature Fix Plan

This plan addresses the broken messaging implementation and organizes the work into two clear phases: Backend (database) and Frontend (UI/hooks).

---

## Current Issues Summary

| Issue | Location | Problem |
|-------|----------|---------|
| Missing table | Database | `user_connections` table does not exist |
| No message history | `Messages.tsx` | Only shows composer, no message thread UI |
| RPC return mismatch | `send_dm` function | Returns `void` but code expects message data |
| Duplicate logic | `Messages.tsx` | `loadChats` effect duplicates hook logic |
| Incomplete real-time | `useMessaging.ts` | Only subscribes to `conversations`, not `messages` |
| Local state for connections | `MyNetwork.tsx` | Uses `useState` instead of database |

---

## Phase 1: Backend (Database and Functions)

### Step 1.1: Create `user_connections` Table

Create the missing connections table that the hooks are already trying to query:

**Schema:**
| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | Primary key |
| `user_id` | uuid | Request sender |
| `connected_user_id` | uuid | Request recipient |
| `status` | text | 'pending', 'connected', 'rejected' |
| `created_at` | timestamptz | Auto-set |
| `updated_at` | timestamptz | Auto-updated |

**Constraints:**
- Unique on `(user_id, connected_user_id)` to prevent duplicates
- Check constraint: `user_id != connected_user_id` to prevent self-connections

### Step 1.2: Add RLS Policies for `user_connections`

| Policy | Command | Rule |
|--------|---------|------|
| View connections | SELECT | User is either `user_id` or `connected_user_id` |
| Create request | INSERT | `auth.uid() = user_id` |
| Accept/reject | UPDATE | `auth.uid() = connected_user_id` |
| Remove connection | DELETE | User is either party |

### Step 1.3: Fix the `send_dm` Function

Update the existing `send_dm` database function to return the inserted message row instead of `void`. This enables proper optimistic updates in the frontend.

**Current signature:**
```text
send_dm(sender uuid, recipient uuid, message_text text) -> void
```

**New signature:**
```text
send_dm(sender uuid, recipient uuid, message_text text) -> SETOF messages
```

### Step 1.4: Add Database Indexes

Create indexes for efficient querying:
- `idx_connections_user_id` on `user_connections(user_id)`
- `idx_connections_connected_user_id` on `user_connections(connected_user_id)`
- `idx_connections_status` on `user_connections(status)`

---

## Phase 2: Frontend (Hooks and UI)

### Step 2.1: Create New `useConversationMessages` Hook

Add a new hook to fetch the actual message history for a conversation:

**File:** `src/hooks/useMessaging.ts`

**Function:** `useConversationMessages(recipientId: string)`
- Fetches all messages between current user and recipient
- Orders by `created_at` ascending (oldest first)
- Includes real-time subscription for new messages

### Step 2.2: Fix `useSendMessage` Optimistic Updates

Update the mutation to handle the new `send_dm` return value:
- Use returned message data for cache updates
- Properly structure `last_message` object with `content` and `created_at`

### Step 2.3: Update `useConnections` Hook

Fix the existing hook to:
- Remove `as any` type casting once table exists
- Filter by `status = 'connected'` to only show accepted connections
- Add proper TypeScript types

### Step 2.4: Create `usePendingRequests` Hook

New hook for incoming connection requests:
- Query where `connected_user_id = current user` and `status = 'pending'`
- Used for notifications/accept-reject UI

### Step 2.5: Redesign Messages Page UI

**File:** `src/pages/Messages.tsx`

Major UI changes:
1. **Remove duplicate `loadChats` effect** - already handled by `useConversations`
2. **Add message history display** - show actual conversation thread
3. **Message list component** - scrollable area with messages from both parties
4. **Visual distinction** - different styling for sent vs received messages
5. **Auto-scroll** - scroll to bottom on new messages
6. **Timestamps** - show message times

**Proposed layout:**
```text
+------------------+---------------------------+
| Recent Chats     |  Conversation Header      |
|  - User 1        |  [Avatar] [Name]          |
|  - User 2        |---------------------------|
|------------------|  Message Thread           |
| Connections      |  [Their message]          |
|  - User 3        |        [Your message]     |
|  - User 4        |  [Their message]          |
|                  |---------------------------|
|                  |  [Input] [Send Button]    |
+------------------+---------------------------+
```

### Step 2.6: Add Real-time Message Subscription

Enhance the messaging hook to subscribe to the `messages` table:
- Filter by conversation participants
- Automatically append new messages to the thread
- Mark messages as read when viewed

### Step 2.7: Update MyNetwork Page

**File:** `src/pages/MyNetwork.tsx`

Changes:
1. Replace local `connectedUsers` state with database query
2. Fetch actual connection status for each user on load
3. Show proper states: "Connect", "Pending", "Connected"
4. Handle accept/reject for incoming requests

---

## Files to Create/Modify

| File | Action | Phase |
|------|--------|-------|
| Database migration | Create | Phase 1 |
| `send_dm` function | Modify | Phase 1 |
| `src/hooks/useMessaging.ts` | Modify | Phase 2 |
| `src/pages/Messages.tsx` | Modify | Phase 2 |
| `src/pages/MyNetwork.tsx` | Modify | Phase 2 |
| `src/integrations/supabase/types.ts` | Auto-update | After Phase 1 |

---

## Technical Details

### Database Migration SQL (Phase 1)

```text
-- Create user_connections table
CREATE TABLE public.user_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  connected_user_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' 
    CHECK (status IN ('pending', 'connected', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  CONSTRAINT no_self_connection CHECK (user_id != connected_user_id),
  CONSTRAINT unique_connection UNIQUE (user_id, connected_user_id)
);

-- Enable RLS
ALTER TABLE public.user_connections ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own connections"
  ON public.user_connections FOR SELECT
  USING (auth.uid() = user_id OR auth.uid() = connected_user_id);

CREATE POLICY "Users can create connection requests"
  ON public.user_connections FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Recipients can update connection status"
  ON public.user_connections FOR UPDATE
  USING (auth.uid() = connected_user_id);

CREATE POLICY "Either party can delete connection"
  ON public.user_connections FOR DELETE
  USING (auth.uid() = user_id OR auth.uid() = connected_user_id);

-- Indexes
CREATE INDEX idx_connections_user ON public.user_connections(user_id);
CREATE INDEX idx_connections_connected ON public.user_connections(connected_user_id);

-- Fix send_dm to return the message
CREATE OR REPLACE FUNCTION public.send_dm(sender uuid, recipient uuid, message_text text)
RETURNS SETOF public.messages
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  convo_id uuid;
  new_message public.messages;
BEGIN
  -- Find existing conversation
  SELECT c.id INTO convo_id
  FROM public.conversations c
  JOIN public.conversation_participants p1
    ON p1.conversation_id = c.id AND p1.user_id = sender
  JOIN public.conversation_participants p2
    ON p2.conversation_id = c.id AND p2.user_id = recipient
  LIMIT 1;

  -- Create conversation + participants if missing
  IF convo_id IS NULL THEN
    INSERT INTO public.conversations DEFAULT VALUES
    RETURNING id INTO convo_id;

    INSERT INTO public.conversation_participants (conversation_id, user_id)
    VALUES (convo_id, sender), (convo_id, recipient);
  END IF;

  -- Insert and return message
  INSERT INTO public.messages (
    conversation_id, sender_id, recipient_id, content
  ) VALUES (
    convo_id, sender, recipient, message_text
  ) RETURNING * INTO new_message;

  RETURN NEXT new_message;
END;
$$;
```

### New Hook Pattern (Phase 2)

```text
useConversationMessages(recipientId: string)
  - Query messages where (sender=me AND recipient=them) OR (sender=them AND recipient=me)
  - Order by created_at ASC
  - Subscribe to postgres_changes on messages table
  - Invalidate on new message events
```

---

## Summary

**Phase 1 (Backend):**
1. Create `user_connections` table with proper schema and constraints
2. Add RLS policies for secure access
3. Update `send_dm` function to return message data
4. Add performance indexes

**Phase 2 (Frontend):**
1. Create `useConversationMessages` hook for message history
2. Fix `useSendMessage` optimistic updates
3. Update `useConnections` to use real database
4. Redesign Messages page with proper message thread UI
5. Add real-time subscriptions for messages
6. Update MyNetwork page to show actual connection status
