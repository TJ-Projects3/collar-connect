# Community Q&A Page Layout & Spacing Polish

## Goal
Improve the visual breathing room, readability, and responsive behavior of the `/community` Q&A feed so the page feels polished on desktop and mobile.

## Scope
Changes are confined to the presentation layer in `src/pages/Community.tsx`. No database or hook changes are required.

## Implementation Plan

### 1. Container Width & Spacing
- Widen the main content area so the feed uses more of the available desktop viewport.
  - Keep the outer page wrapper at `max-w-6xl` (currently `max-w-5xl`) with `mx-auto`.
  - Adjust the two-column layout ratio to give the question list more room (e.g., `lg:grid-cols-12` with main content spanning 9 columns and the sidebar 3 columns, or remove the sidebar column width reduction while preserving the sticky sidebar).
- Add consistent vertical rhythm:
  - `gap-6` between the header/search/filter card and the question cards.
  - `gap-4` or `gap-6` between individual question cards.

### 2. Card Typography & Layout
- Remove the aggressive `line-clamp-2` from question titles so titles wrap naturally.
- Keep a milder `line-clamp-3` on the body preview only if needed, but increase its line-height to `leading-relaxed` and add slightly more padding.
- Ensure the card internal flex layout does not squash the text column against the vote box.

### 3. Question Card Meta Footer
- Restructure each question card footer into two clearly separated zones:
  - **Left:** author avatar (32px), full name, `RoleBadge` (Student/Industry/Recruiter), and relative timestamp, all in a single horizontal row with `gap-2`.
  - **Right:** an answer-count pill with a `MessageSquare` icon and text such as "0 answers" / "2 answers".
- Prevent awkward wrapping:
  - Use `flex-wrap` on the author meta row at small breakpoints only.
  - Give the role badge `shrink-0` and keep it from colliding with the name/timestamp by using `min-w-0` and `truncate` where appropriate.
  - Ensure the answer-count pill has `shrink-0` and does not wrap into the author block.

### 4. Action & Filter Bar
- Separate the search input and "+ Ask a Question" CTA cleanly:
  - Place the CTA on the left and the search input on the right in a `flex-col sm:flex-row` row with `gap-3`.
  - Make the CTA button primary and keep it from stretching full-width on mobile if it harms usability; otherwise stack them vertically with the CTA full-width above the search bar.
- Convert the filter tabs (New / Top / Unanswered) into distinct pill-style buttons:
  - Active tab uses `variant="default"` with rounded-full/pill shape.
  - Inactive tabs use `variant="outline"` or a subtle background so they look like selectable pills rather than ghost text.
  - Minimum hit target of `h-9` and adequate horizontal padding (`px-4`).
  - Remove the generic `Filter` icon or keep it only as a decorative label to reduce visual clutter.

## Files to Modify
- `src/pages/Community.tsx`

## Out of Scope
- No changes to `AskQuestionModal.tsx`, vote logic, hooks, or database schema.
- No new components; reuse existing `RoleBadge`, `Badge`, `Button`, `Input`, `Card`, and icons.
