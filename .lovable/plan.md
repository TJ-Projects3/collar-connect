
# Messaging Feature Implementation Plan

## Overview

This plan implements a complete messaging flow where users can:
1. Go to a user's profile and click "Message"
2. Type and send a message
3. See the recipient in their Recent Chats
4. The recipient sees the message in their Recent Chats
5. Both users can reply back and forth

---

## Current Issues Identified

| Issue | Cause | Impact |
|-------|-------|--------|
| `useConversations` returns 400 error | No foreign keys on `messages.sender_id` / `recipient_id` to `profiles` table | Cannot fetch profile data with messages |
| `useConnections` returns 404 error | Queries non-existent `user_connections` table | Connections section breaks the page |
| No chat history display | UI only shows input box, not message thread | Users can't see conversation history |
| Existing messages have `null` conversation_id | Legacy data wasn't linked to conversations | Breaks conversation-based queries |

---

## Phase 1: Database Fixes

### 1.1 Add Foreign Keys to Messages Table

Add constraints so PostgREST can resolve profile relationships:

```text
ALTER TABLE public.messages
ADD CONSTRAINT messages_sender_id_fkey 
  FOREIGN KEY (sender_id) REFERENCES public.profiles(id);

ALTER TABLE public.messages
ADD CONSTRAINT messages_recipient_id_fkey 
  FOREIGN KEY (recipient_id) REFERENCES public.profiles(id);
```

This enables queries like:
```
.select(`*, sender:sender_id(full_name, avatar_url), recipient:recipient_id(full_name, avatar_url)`)
```

---

## Phase 2: Hook Rewrite

### 2.1 Rewrite `useConversations` Hook

**New approach** - Query messages directly with profile joins (now possible with foreign keys):

```text
Query Strategy:
1. Fetch all messages where user is sender OR recipient
2. Join sender_id and recipient_id to profiles table
3. Group by the other person (counterpart)
4. Return latest message per counterpart
5. Sort by most recent message
```

This is simpler than the conversation_participants approach and works with existing data.

### 2.2 Add `useConversationMessages` Hook

New hook to fetch all messages between current user and a selected recipient:

```text
Query:
- messages where (sender = me AND recipient = them) OR (sender = them AND recipient = me)
- Order by created_at ASC (oldest first for chat display)
- Include real-time subscription for new messages
```

### 2.3 Remove Broken Code

Delete the following from `useMessaging.ts`:
- `useConnections` hook (queries non-existent table)
- `useAddConnection` hook (same issue)

---

## Phase 3: Profile Page Integration

### 3.1 Update Message Button Flow

The Profile page already has a "Message" button that opens a dialog. Enhance it to:

1. Keep the dialog for composing the initial message
2. On successful send, navigate to `/messages?recipientId={userId}`
3. This opens the Messages page with that conversation active

**File:** `src/pages/Profile.tsx` (lines 146-157)

---

## Phase 4: Messages Page Rework

### 4.1 Remove Connections Section

Remove the broken "Connections" card (lines 96-122) that causes 404 errors.

### 4.2 Add Chat History Display

When a recipient is selected, show:

```text
+----------------------------------+
| [Avatar] Recipient Name          |  <- Header
|----------------------------------|
| [Their message]        10:30 AM  |  <- Left aligned
|                                  |
|        [Your message]  10:32 AM  |  <- Right aligned
|                                  |
| [Their reply]          10:35 AM  |
+----------------------------------+
| [Type message...]        [Send]  |  <- Input area
+----------------------------------+
```

### 4.3 UI Component Structure

```text
Messages Page
├── Sidebar (lg:col-span-4)
│   └── Recent Chats Card
│       └── List of conversations
│           └── Avatar, Name, Last Message Preview, Time
│
└── Main Area (lg:col-span-8)
    ├── Chat Header (when recipient selected)
    │   └── Avatar, Name of recipient
    ├── Messages Container (ScrollArea)
    │   └── Message bubbles (aligned by sender)
    └── Input Area
        └── Textarea + Send Button
```

---

## Technical Details

### Files to Modify

| File | Action | Changes |
|------|--------|---------|
| Database | Migration | Add 2 foreign key constraints |
| `src/hooks/useMessaging.ts` | Rewrite | Fix `useConversations`, add `useConversationMessages`, remove broken hooks |
| `src/pages/Messages.tsx` | Major Update | Remove Connections section, add chat history UI |
| `src/pages/Profile.tsx` | Minor Update | Navigate to Messages page after sending |

### New Hook: `useConversationMessages`

```text
Parameters: recipientId (string)

Returns: 
- messages: Array of message objects with sender profile
- isLoading: boolean
- Real-time subscription for new messages

Query Pattern:
supabase
  .from("messages")
  .select(`*, sender:sender_id(full_name, avatar_url)`)
  .or(`and(sender_id.eq.${userId},recipient_id.eq.${recipientId}),and(sender_id.eq.${recipientId},recipient_id.eq.${userId})`)
  .order("created_at", { ascending: true })
```

### Updated Message Flow

```text
User Journey:
1. Visit /profile?userId=xyz
2. Click "Message" button
3. Dialog opens with text input
4. Type message and click "Send"
5. send_dm RPC creates message
6. Navigate to /messages?recipientId=xyz
7. Messages page loads with:
   - Recent Chats showing the recipient
   - Chat area showing the message thread
8. Recipient visits /messages
9. Sees sender in Recent Chats with message preview
10. Clicks to open conversation
11. Types reply, which appears for both users (real-time)
```

---

## Summary of Deliverables

**Backend (1 migration):**
- Add `messages_sender_id_fkey` foreign key
- Add `messages_recipient_id_fkey` foreign key

**Frontend (2 files):**
- Rewrite `src/hooks/useMessaging.ts` with working queries
- Rework `src/pages/Messages.tsx` with chat history UI

**Minor Updates (1 file):**
- Update `src/pages/Profile.tsx` to navigate after send

**Removed Code:**
- `useConnections` hook
- `useAddConnection` hook  
- Connections card from Messages page
