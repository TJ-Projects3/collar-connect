# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

NextGen Collar is a professional networking platform for the tech sector, championing diversity and inclusion. Built with React 18, TypeScript, and Supabase as the backend.

## Development Commands

```bash
npm run dev      # Start dev server (port 8080)
npm run build    # Production build
npm run lint     # Run ESLint
npm run preview  # Preview production build
```

## Tech Stack

- **Frontend:** React 18 + TypeScript + Vite (SWC)
- **Styling:** Tailwind CSS + shadcn/ui components
- **Forms:** React Hook Form + Zod validation
- **Data Fetching:** TanStack React Query v5
- **Backend:** Supabase (PostgreSQL, Auth, Storage)
- **Routing:** React Router v6

## Architecture

### Authentication Flow
`AuthContext.tsx` provides global auth state via `useAuth()` hook. Sessions persist in localStorage with Supabase handling token refresh.

### Route Protection
`ProtectedRoute.tsx` guards authenticated routes, redirecting to `/auth` if no session. It wraps children with `OnboardingWrapper` which checks profile completion.

### Data Fetching Pattern
Custom hooks in `src/hooks/` wrap Supabase calls with React Query:
- Query keys follow `[feature, userId]` pattern
- Mutations auto-invalidate related queries
- Example: `useProfile()`, `useUpdateProfile()`, `useUploadAvatar()`

### Form Pattern
Forms use React Hook Form with Zod resolver for validation. See `OnboardingModal.tsx` for the complete pattern including file uploads.

## Project Structure

```
src/
├── components/ui/     # shadcn/ui components (do not edit directly)
├── components/        # Feature components (ProtectedRoute, Onboarding*, ReplyModal, ShareDialog, ExperienceFormModal)
├── contexts/          # AuthContext
├── hooks/             # React Query hooks (useProfile, useMessaging, useExperiences, usePostLikes, usePostReplies)
├── pages/             # Route components (Profile, Messages, etc.)
├── integrations/supabase/
│   ├── client.ts      # Supabase client init
│   └── types.ts       # Auto-generated DB types (do not edit)
└── lib/utils.ts       # Tailwind merge utility (cn function)
```

## Supabase Database

Key tables with RLS enabled:
- **profiles** - User profiles linked to auth.users
- **messages** - Direct messages between users (real-time enabled)
- **experiences** - Work history entries for user profiles
- **posts** - User activity posts with likes/replies
- **events** - Platform events
- **event_attendees** - Event registrations with status enum
- **event_speakers** - Speaker info with profile links
- **memberships** - User membership tracking

Database functions:
- `send_dm(sender, recipient, message_text)` - RPC for sending direct messages

Avatar storage uses the "avatars" bucket with path pattern `{userId}/avatar.{ext}`.

### Messaging System
Real-time direct messaging with Supabase subscriptions:
- `useConversations()` - Lists conversations grouped by counterpart with last message
- `useConversationMessages(recipientId)` - Fetches message thread
- `useSendMessage()` - Sends via `send_dm` RPC, updates cache optimistically
- Routes: `/messages` with optional `?recipientId=` to open specific chat

### Profile Features
Profiles support viewing other users via `?userId=` query param:
- `useExperiences(userId)` - Work history CRUD with `useAddExperience`, `useUpdateExperience`, `useDeleteExperience`
- `useAllProfiles()` - Lists all users for connections sidebar
- Message button on profiles initiates DM and redirects to `/messages`

## Path Aliases

Use `@/` to import from `src/`:
```typescript
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/AuthContext"
```

## Design System

CSS variables defined in `index.css` use HSL format. Primary color is dark blue (203 60% 26%), accent is cyan (186 70% 45%). Dark mode supported via class attribute.
