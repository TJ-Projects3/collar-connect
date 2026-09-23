# Fix the broken profile picture in navigation

## What I checked first

- The photo storage area for profile pictures is already set to public, and your own stored photo loads fine when requested directly (a normal image comes back).
- The navigation already asks for initials as a backup, and shows "ME" when no name is stored.

So the storage setting is not the problem. The most likely cause is that the browser never completes the image request — privacy/ad-blocking extensions commonly block requests to the storage host, which leaves a blank or broken-looking circle. This is the same class of problem we already worked around for resume files in this app.

## What I'll change

1. Add one shared profile-picture component that every place in the app uses:
   - shows the photo when it loads,
   - shows the person's initials when there is no photo,
   - shows a generic person icon when initials aren't available,
   - and immediately falls back if the photo fails, is blocked, or never finishes loading (short timeout), instead of leaving a broken square.
2. Use it in the top-right "Me" avatar and its dropdown, the tablet sidebar, and the mobile slide-out menu, so all four spots behave identically.
3. Keep the same sizes, colors, and rounded styling — purely a reliability fix, no visual redesign.

## Storage permissions

No change needed: the avatars area is already public and serving images correctly. I'll note this rather than alter it.

## Technical notes

- New `src/components/ui/user-avatar.tsx` wrapping `Avatar`/`AvatarImage`/`AvatarFallback` with local `loaded`/`failed` state, `onError` handling, a ~4s load timeout, and a `User` lucide icon fallback when `getInitials` has nothing meaningful.
- Replace the inline `Avatar` blocks in `src/components/Navbar.tsx` (both instances), `src/components/layout/SideNav.tsx`, and `src/components/layout/MobileMenuSheet.tsx` with `<UserAvatar name={...} src={...} className="h-6 w-6" />`.
- Verified: `storage.buckets.avatars.public = true`; `HEAD` on a stored avatar URL returns `200 image/jpeg`.
- Verification: typecheck plus a preview check of the navigation avatar at desktop and mobile widths.
