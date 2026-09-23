# Fix flickering hover on the profile card

Two spots on your profile page flicker when hovered: your name area (the connection count line right under it) and the "View all" button in the Connections box.

## What I found so far

Neither the name nor "View all" has a tooltip or pop-up layer attached, so the classic "tooltip steals the hover" cause is not present here. The likely cause is that the Connections box is defined inside the profile page rather than as its own piece, so it gets thrown away and rebuilt whenever anything on the page changes — which makes the list briefly flash "Loading..." and the hover highlight blink. This is not yet confirmed, so the first step is to reproduce and confirm it.

## Steps

1. Reproduce the flicker in the running app: hover your name and the "View all" button, record what redraws, and confirm whether the Connections box is being rebuilt (loading flash) or whether it's purely a styling issue.
2. Stabilise the Connections box so it stops being rebuilt on every page change, keeping its behaviour and data identical.
3. Smooth the hover styling on both targets: the connection count under your name and the "View all" button get a single 200ms transition instead of an abrupt colour/underline change, and the hover area stays steady so it can't toggle on and off as the pointer moves.
4. Make any decorative overlay inside the hovered areas ignore the pointer, so it cannot take the hover away from its container.
5. Re-check by hovering both elements again and confirm no blink, no loading flash, and no layout jump.

## Technical notes

- `ConnectionsSidebar` is currently declared inside the `Profile` component body, so it's a new component type each render and React remounts it, re-running `useUserConnections` and flashing the loading branch. Move it to module scope (or its own file) and pass `onViewAll` / `currentUserId` as props.
- Apply `transition-all duration-200` to the connection-count button (`src/pages/Profile.tsx`, currently `hover:underline` with no transition) and the "View all" ghost button.
- Replace `hover:underline` with a transition-friendly underline (e.g. `decoration-transparent hover:decoration-current underline underline-offset-2`) so nothing shifts layout on hover.
- Add `pointer-events-none` to any absolutely positioned child inside those hover targets (e.g. avatar overlay patterns like the one in `EditProfileModal`) if verification shows one is in the hover path.
- Scope: presentation only — no data, query, or schema changes.
