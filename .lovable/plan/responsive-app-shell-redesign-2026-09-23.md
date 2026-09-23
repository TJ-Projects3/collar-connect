# Responsive App Shell Redesign

Rework navigation into one shared shell with three behaviours: phone, tablet, desktop. Navigation is currently added by each page separately; it moves into a single shell so every page stays consistent.

## Phone (under 768px)

- Slim top strip: logo on the left, search icon and hamburger button on the right. The full desktop nav row is hidden.
- Fixed bottom tab bar with five items: Home, Network, Jobs, Messaging, Notifications. Unread counts appear on Messaging and Notifications.
- Hamburger opens a slide-out menu with everything else: Q&A, Talent (when allowed), Admin (admins only), Me/Profile, Calendar, Content Hub, Settings, Sign out. It shows the user's avatar and name at the top.
- Page content gets top and bottom spacing so nothing hides behind the top strip or bottom bar, including safe-area spacing for phones with a home bar.

## Tablet (768px to 1024px)

- Left vertical sidebar, fixed full height, with icon plus text label for each destination, active item highlighted.
- Sidebar holds the same destinations as the bottom bar plus Q&A, Talent, Admin, and a profile/account block at the bottom.
- No bottom bar and no top nav row at this size; a compact top row keeps search.
- Page content is offset from the left so the sidebar never overlaps it.

## Desktop (1024px and up)

- Keeps the current top navigation bar, notification popover, and profile dropdown unchanged.

## Notifications behaviour

- Phone and tablet: tapping Notifications goes to the `/notifications` page.
- Desktop: keeps the existing dropdown popover.

## Technical notes

- New `src/components/layout/AppShell.tsx` owns the responsive decision and renders `TopBar` (desktop/compact), `SideNav` (tablet), `BottomNav` (phone), and a `MobileMenuSheet`.
- Navigation destinations move into a single `src/components/layout/nav-items.ts` module so all three surfaces read one list, with `showTalent` (via `canViewTalent`) and `isAdmin` gating preserved.
- `ProtectedRoute` wraps children in `AppShell` instead of only `BottomNav`. The `<Navbar />` call is removed from the 14 pages that render it (Feed, Jobs, Messages, MyNetwork, Community, Profile, Talent, Settings, Notifications, Admin, Calendar, ContentHub, CareerMapping, plus loading branches in Talent/CareerMapping).
- `Navbar.tsx` is refactored into the desktop/compact top bar; the existing `NotificationBell` popover and profile dropdown are reused as-is. `BottomNav.tsx` entries change to Home / Network / Jobs / Messaging / Notifications.
- Content offsets are applied in the shell wrapper (`md:pl-` for the tablet sidebar, `pb-[calc(...+env(safe-area-inset-bottom))]` for the phone bar) so pages need no per-page padding changes.
- Existing sticky sidebars inside Feed, Community, and Messages are checked at each breakpoint so they don't collide with the new shell.
- No database or backend changes.

## Verification

- TypeScript check.
- Browser screenshots at 390px, 834px, and 1440px on Feed, Jobs, Messages, and Community to confirm no overlap or horizontal scroll.
