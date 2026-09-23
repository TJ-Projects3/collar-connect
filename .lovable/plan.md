# Fix Candidate Discovery Layout Spacing and Card Overflow

## What's happening

On tablet-width screens (768px–1024px) the navigation is a fixed left sidebar, and the page content is pushed 224px to the right to clear it. The page itself only adds 16px of breathing room on each edge, so visually the left side has a wide gap while the cards sit just 16px from the right edge — which reads as cut off and unbalanced. On the current 963px-wide preview this is exactly the case.

## Changes

1. **Balanced page gutters on Candidate Discovery**
   - Increase the page's side spacing so it scales with screen size (16px on phones, 24px on tablets, 32px on wide screens) instead of a flat 16px.
   - Apply the same spacing to the loading and restricted-access views of the page so nothing jumps when content loads.
   - Give the sidebar-offset wrapper matching right-side spacing on tablet widths, so every page — not just this one — keeps an even gap from the right edge when the left sidebar is showing.

2. **Candidate cards handle narrow widths gracefully**
   - Name: allow it to shrink and truncate with an ellipsis rather than fight for space with the verified badge and the block button.
   - Move the block (person-with-x) button out of the wrapping name row into its own fixed slot at the top-right of the card, so it can never be pushed onto its own line or overlap the name.
   - School / major / class line: clamp to two lines so a long school name cannot stretch the card.
   - Verified-intern badge, endorsement pills, availability, and skill chips: keep wrapping and stop their label text from breaking mid-word.
   - Top-project row: keep the thumbnail fixed and let the title truncate inside a shrinkable container.
   - Action buttons: allow the label text to truncate so "Message Candidate" and "View profile" stay side by side without squashing, and keep them stacked on the narrowest widths as they already do.

## Technical details

- `src/pages/Talent.tsx`: swap `px-4` for `px-4 sm:px-6 lg:px-8` on the three container wrappers.
- `src/components/layout/AppShell.tsx`: add `md:pr-4 lg:pr-0` alongside the existing `md:pl-56 lg:pl-0` offset.
- `src/components/talent/CandidateCard.tsx`: restructure the header into `[avatar] [min-w-0 flex-1 details] [flex-shrink-0 block button]`; add `truncate` / `line-clamp-2` / `min-w-0` and `whitespace-nowrap` on badge labels; add `min-w-0` + `truncate` inside the action buttons.
- No data, access-level, or metering logic changes — presentation only.

## Verification

TypeScript check, plus width checks at 393px, 768px, 963px, and 1440px for horizontal overflow. This page requires a signed-in recruiter/industry account on your own Supabase project, which I can't sign into here, so a quick look at `/talent` on your side confirms the visual result.
