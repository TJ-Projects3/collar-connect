## Goal
Add Isaiah Osuntuyi as an admin and align the Settings Developer Mode gate with the `user_roles` admin system so all admins get access.

## Changes

### 1. Database
- Insert an `admin` row into `user_roles` for Isaiah Osuntuyi's user id (looked up via `profiles.full_name` / auth email `isaiahosuntuyi@gmail.com`).

### 2. Settings dev-mode gate (`src/pages/Settings.tsx`)
- Replace the current `user?.email === "isaiahosuntuyi@gmail.com" || profile?.is_admin` check with a check against the `user_roles` table using the existing `has_role(auth.uid(), 'admin')` pattern.
- Add a small `useIsAdmin()` hook (or inline query) that calls `supabase.rpc('has_role', { _user_id: user.id, _role: 'admin' })` and caches with React Query.
- Show the Developer Mode card only when that returns true.

### 3. Cleanup
- Leave the `profiles.is_admin` column in place for now (no destructive migration), but stop reading it in Settings so `user_roles` becomes the single source of truth for admin gating.

## Result
- Isaiah + the 3 existing admins (Tiwa, Tia, Joshua) all see the Developer Mode toggle.
- Admin access is governed uniformly by `user_roles`, matching the project's role system.