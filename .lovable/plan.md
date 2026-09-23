# Job Board & Profile Card Responsiveness

The responsive navigation shell (mobile bottom tab bar, hamburger menu, tablet sidebar, and content offsets) is already in place from the previous change, so this plan covers the remaining card and layout scaling work on the Job Board and Profile pages, plus a pass to confirm the navigation spacing holds on every page.

## Job Board (/jobs)

- Job cards already stack one per row on phones; the squashing comes from the card header, where the title/company column and the badge cluster sit side by side and the badges refuse to shrink. Rework the header so on phones the title and company get the full card width and the badges drop to their own wrapping row underneath, with the bookmark button pinned top-right. From small screens up it keeps the current side-by-side arrangement.
- Let long job titles and company names wrap instead of being compressed, and stop long location or "Posted x days ago" metadata from being squeezed — the metadata row wraps line by line.
- The search and action row: on phones the search field, "Internships & Early Career", "Filters", and "Clear" buttons each span the full width, with their labels allowed to wrap rather than overflow.
- Track filter pills: keep wrapping, with tighter padding on phones so rows stay readable.
- Tracker view cards get the same header treatment so saved jobs look identical to search results.
- "Apply Now" stays full width on phones.

## Profile page

- Header action buttons (Connect, Message, Book 1-on-1, Edit profile) span the full width and stack cleanly on phones instead of wrapping into uneven partial rows.
- Badge and metadata pill rows wrap without pushing the card wider than the screen.
- Section card headers that place a title and an action button on one row switch to stacked on phones so the titles are not compressed.
- Long names, headlines, universities, and links wrap rather than overflowing the card.

## Cross-page margin check

- Verify at phone, tablet, and desktop widths that page content clears the top strip, tablet sidebar, and bottom tab bar on Feed, Jobs, Profile, Messages, Community, and My Network, and that no page scrolls sideways.

## Technical notes

- Changes are limited to presentation markup and Tailwind classes in `src/pages/Jobs.tsx`, `src/components/jobs/TrackerBoard.tsx`, and `src/pages/Profile.tsx`. No hooks, queries, or database changes.
- Job card header becomes a `flex-col sm:flex-row` block; the badge cluster loses `shrink-0`/`justify-end` on mobile and uses `flex-wrap` with `min-w-0` on the text column; titles get wrapping rather than clamping.
- Buttons use `w-full sm:w-auto` with `whitespace-normal` where labels are long.
- Verification: TypeScript check plus browser screenshots at 390px, 834px, and 1440px, asserting `scrollWidth` equals the viewport width on each page.

## Known limitation

This project uses an external Supabase backend, so signed-in pages cannot be captured automatically here; layout will be measured where possible and the signed-in screens need a quick manual look on your device.
