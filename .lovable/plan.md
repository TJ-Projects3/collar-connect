# Fix connection count + add Connections modal on the profile page

## What's happening

The database shows 7 accepted connections for your account, and the sidebar list ("Connections (7)") matches that. The number on the profile card comes from a different, separate count request and shows 1 — so the two parts of the page disagree.

I have not yet confirmed exactly why that separate count request returns the wrong number (it needs to be run while signed in as you). So step 1 is to reproduce it signed in, and the fix makes the card count come from the same data the sidebar already reads correctly, so both can't drift apart again.

## Changes

### 1. Accurate connection count
- Rework the connection-count lookup so it fetches the accepted connection rows for the viewed person and counts unique connected people, instead of relying on the separate counting request that is currently returning a wrong value.
- Share that one source between the profile card and the sidebar header so both always show the same number.
- Keep it working both for your own profile and when viewing someone else's profile (subject to existing privacy rules).
- Fix the singular/plural wording so "1 connection" vs "7 connections" is always right.

### 2. Connections modal
- Clicking the connection count no longer navigates to the network page. It opens a modal titled "Connections" listing that person's accepted connections with avatar, name, and headline/role.
- Each row links to that person's profile and closes the modal.
- The list is scrollable, shows a loading state, and an empty state ("No connections yet").
- A "View all in My Network" link at the bottom keeps the old destination available for anyone who wants the full page.
- Mobile-friendly: full-width rows, truncating long names/headlines, no horizontal overflow.

## Technical notes

- `src/hooks/useConnections.ts`: replace the `head: true` exact-count query in `useConnectionCount` with a row fetch of `status = 'accepted'` rows for the given user id, deriving the counterpart id set and returning its size; add a `useUserConnections(userId)` hook returning the connection profiles (id, full_name, avatar_url, job_title) for any user id, with `useMyConnections` reusing it.
- New `src/components/profile/ConnectionsModal.tsx` using the existing shadcn `Dialog` + `UserAvatar` components and the new hook.
- `src/pages/Profile.tsx`: swap the `Link to="/my-network"` count for a button that opens the modal; point the sidebar header count at the same hook.
- Verify signed in at 393px and 1440px: card count equals sidebar count equals the 7 accepted rows in the database, and the modal lists all of them.
