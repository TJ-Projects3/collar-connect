# Profile Page Cleanup: Dedupe Header, Resume Actions, Pill Consistency

Right now a student's degree and school print three times: the grey subline under the name ("Computer Science · Towson University"), the "Student · Towson University" role pill, and the metadata pill strip. The Student profile card repeats the same academics and graduation line a fourth time, and the Developer Portfolio card is mostly empty whitespace holding two resume buttons.

## 1. Header deduplication

- The metadata pill strip stays the single source of truth for degree, expected graduation, and work status.
- The role badge for students renders as just "Student" (no school suffix) on the profile header, so the institution appears once.
- The grey subline no longer prints academics for students. It falls back, in order, to the user's headline/job title, then to the welcome line on your own empty profile; if there's nothing to say it renders nothing instead of an empty gap.
- Location, website, and connection count keep their current placement.

## 2. Resume actions moved into the action row

- "View Resume" and "Download Resume" move up next to "Edit Profile" (and next to Connect/Message when viewing someone else's profile), where profile-level actions belong.
- The Developer Portfolio card then holds only GitHub / LinkedIn / Portfolio links, and hides itself entirely when a viewer sees no links — no more empty card.
- On your own profile with nothing filled in, the card keeps its short "add your links" prompt.
- Resume preview and download behaviour is unchanged (same modal, same base64 download path).

## 3. Student card and pill consistency

- The Student profile card drops the duplicated academics + "Expected graduation" block and leads with Skills & tools, Target tracks, and Work status.
- All pill tags (header strip, skills, tracks, work status) share one set of size, padding, radius, and gap values, plus a subtle hover state, so they read as one system on mobile and desktop.
- Section spacing inside the cards is normalised so groups don't sit tighter in one card than another.

## 4. Copy pass

Sweep the profile page and its role cards for typos and inconsistent casing (e.g. mixed "Sentence case" vs "Title Case" headings, stray punctuation in labels) and settle on sentence case for section headings.

## Technical notes

- Files: `src/pages/Profile.tsx` (subline logic, badge props, action row, pill strip), `src/components/StudentBadge.tsx` (used with `compact` in the profile header only — feed/comment usage unchanged), `src/components/DeveloperPortfolioCard.tsx` (resume buttons removed, empty-state guard), `src/components/student/StudentProfileCard.tsx` (remove academics block).
- Resume actions extract into a small `ResumeActions` component under `src/components/` so the header row and any future placement share one implementation, including the existing `ResumePreviewModal` and download error toast.
- Shared pill classes live in one exported constant (colocated with the existing profile display helpers) and use semantic tokens only — no hardcoded colors.
- No database or hook changes.
