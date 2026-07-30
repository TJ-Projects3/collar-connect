# Profile Header Polish

## 1. Fix the role duplication
Currently the recruiter role appears twice: as a pill beside the name (`RecruiterBadge` → "Hiring Recruiter") and again as the subtitle, because `getProfileSubline` falls back to the string "Hiring Recruiter" when a recruiter has no company title/name.

Changes:
- In `src/lib/profile-display.ts`, stop returning "Hiring Recruiter" as a recruiter fallback. Return the company title/company when present, otherwise an empty string so no redundant subtitle renders.
- Name line keeps only the identity badge (verified status), not the job description.
- Headline hierarchy below the name:
  1. Role/headline line (e.g. "Talent Partner @ Capital One", or "Computer Science · Georgia Tech" for students) in a slightly larger, normal-weight foreground-muted style.
  2. Location / website row.
  3. Connection count link.
- Render the subtitle line only when non-empty, so spacing doesn't collapse into an empty gap.

## 2. Sleek verified/achievement pills
- Rework `src/components/RecruiterBadge.tsx` into a shared pill style: rounded-full, high-contrast token-based colors, `BadgeCheck` icon, tight tracking, `text-[11px]`, no all-caps shouting. Verified state uses solid primary/secondary token fill with its `-foreground` text; unverified uses a subtle outline variant labelled "Recruiter".
- Match `EndorsementPill` in `src/components/endorsements/EndorsementBadges.tsx` to the same geometry (same radius, padding, icon size, font size) so recruiter + achievement pills sit on one visually consistent row. Keep the gold accent for endorsements but move the hardcoded gold into a semantic token (`--achievement` / `--achievement-foreground`) in `index.css` + `tailwind.config.ts` instead of inline hex/hsl styles.
- Pills move onto their own wrap-friendly row under the name rather than inside the `h1`, which also fixes awkward line-height when the name wraps on mobile.

## 3. Alignment, spacing, typography
In `src/pages/Profile.tsx` header block:
- Avatar/name/action column: keep avatar overlapping the banner, but align the name block and action buttons on a consistent baseline; on mobile the action buttons stack full-width instead of squeezing beside the name.
- Normalize the type scale: name `text-2xl sm:text-3xl` (down from `4xl`, which overpowers the card on desktop), headline `text-sm sm:text-base`, meta row `text-sm`.
- Consistent vertical rhythm via a single `space-y` on the info column instead of mixed `mt-*` values; badges row gets `gap-2 flex-wrap`.
- Ensure long names/company strings wrap with `break-words` and don't push the action buttons off-screen at narrow widths.

## Technical notes
Files touched: `src/pages/Profile.tsx`, `src/lib/profile-display.ts`, `src/components/RecruiterBadge.tsx`, `src/components/endorsements/EndorsementBadges.tsx`, `src/index.css`, `tailwind.config.ts`. No database or data-fetching changes. `getProfileSubline` is also used elsewhere (Feed, Talent, Navbar); returning an empty string for company-less recruiters is safe there since those call sites pass their own fallback, and I'll verify each call site renders correctly with an empty value.

Verification: check the profile header rendered at desktop and mobile widths for an admin/recruiter account and a student account with endorsements.
