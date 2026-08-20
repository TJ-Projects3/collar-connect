# UX/UI Clean-up & Navigation Audit

Goal: one consistent navigation shell, one header pattern, one button/action language across mobile and desktop.

## 1. Mobile bottom navigation (new)

Add a fixed bottom navigation bar shown only on mobile (`md:hidden`):

- Five balanced items, evenly spaced: Home, Network, Q&A, Messages, Profile.
- Active state: filled icon + brand-colored label + a small top indicator bar; inactive uses muted foreground.
- Larger tap targets (min 44px height) and safe-area bottom padding so it clears the iPhone home bar.
- No overlap: every page gets bottom padding on mobile so the last feed card, comment input, and message composer are never hidden behind the bar. The Messages thread composer sits directly above the bar.
- The mobile top bar slims to: logo, search, notifications bell, hamburger (secondary destinations only — Jobs, Talent, Calendar, Career Mapping, Content Hub, Settings, Admin, Sign Out).

## 2. Shared PageHeader component

New reusable header used under the global navbar on Feed, Q&A Community, Talent Directory, and Admin:

- Optional back button (icon + label), page title, optional subtitle, optional right-side action slot.
- Identical padding, title size, and border treatment on every page; responsive title scaling.
- Replaces the current one-off headers: Admin's hand-rolled back bar, Community's "All questions" link and inline titles, Talent's bare `h1`, and Feed's untitled top area.
- Search stays in the global navbar (one search entry point); page-level filters remain in each page's own filter row.

## 3. Button & action consistency

- Standardize modal footers across Edit Profile, Create Post, Ask Question, Report, Block, Project, Experience, and Portfolio modals: same button order (secondary Cancel, then primary action), same size, brand primary color, and a spinner + disabled state while pending.
- Every submit path ends in a toast: success or error, with consistent wording.
- Destructive confirmations (Block, Delete) use the destructive variant consistently.

## 4. Card action cleanup

- Feed post cards keep only **React** and **Comment** as visible actions. Share/copy-link moves into the existing 3-dot menu alongside Report, Block, Edit, and Delete.
- Q&A question and answer cards follow the same rule: vote + reply visible, everything else in the 3-dot menu.
- The 3-dot menu becomes the single home for secondary actions on all cards, with consistent icon + label styling and grouping (content actions, then destructive).

## Technical notes

- New `src/components/layout/BottomNav.tsx` and `src/components/layout/PageHeader.tsx`.
- Bottom nav rendered once inside the authenticated layout path (alongside `Navbar`) rather than per page; pages get a shared `pb-*` utility class for clearance.
- Safe-area handling via `env(safe-area-inset-bottom)` and existing viewport meta.
- All colors come from existing semantic tokens (`primary`, `muted-foreground`, `border`) — no hardcoded color utilities.
- No database, RLS, or business-logic changes; presentation and navigation only.
