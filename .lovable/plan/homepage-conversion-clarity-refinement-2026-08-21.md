# Homepage Conversion & Clarity Refinement

## Goal
Refine the public landing page so first-time visitors immediately understand the three-sided marketplace (Students, Mentors/Industry, Recruiters), see a clear CTA hierarchy, and are guided into the right signup flow with their role pre-selected.

## Current State (verified)
`src/pages/Landing.tsx` currently shows:
- A hero with three same-weight outline/solid buttons side-by-side.
- A metric card (10k+ Students, 500+ Recruiters) floating inside the hero visual on the right.
- Three pillar cards under "Built for Students, Mentors & Recruiters" with icons and descriptions.
- Three "Live Features" cards that use generic Lucide icons.
- Auth already reads `?role=` and `?mode=signup` in `src/pages/Auth.tsx`.

## Proposed Changes

### 1. Hero CTA Hierarchy
Replace the three horizontal solid/outline buttons with a clear visual ladder:

```text
[ Primary solid ] Map Your Career          → /auth?role=student&mode=signup
[ Secondary outline ] Find Top Talent        → /auth?role=recruiter&mode=signup
Are you an industry professional? Join as a Mentor →  → /auth?role=industry&mode=signup
```

- Primary: solid `Button` with existing primary gradient/shadow hover.
- Secondary: `variant="outline"` ghost-style button.
- Tertiary: text link styled as a subtle pill/underlined sub-link beneath the buttons.
- Mobile: stack vertically; desktop: primary + secondary inline, tertiary centered below.

### 2. Social Proof Metric Strip
- Add a third counter: **250+ Industry Mentors**.
- Move the metric bar directly under the hero headline/CTA block as a single horizontal badge strip.
- Remove the isolated floating stats card inside the right-side hero visual (or repurpose it as a softer testimonial/quote card).
- Use muted background, rounded pills, and semantic token colors so it feels integrated, not floating.

### 3. "Built for Students, Mentors & Recruiters" Section
- Add a small role badge tag at the top of each pillar card:
  - Students → `StudentBadge`
  - Mentors/Industry → `IndustryBadge` with `mentor` flag
  - Recruiters → `RecruiterBadge`
- Make all three cards equal height (`h-full`, `flex-col`, `flex-1` on content).
- Keep the existing subtle hover lift; add a short action-oriented micro-line at the bottom of each card (e.g. "Start your roadmap →", "Share your expertise →", "Source verified talent →").

### 4. Feature Preview Teasers
In the "Live Features" section, keep the title/description but replace the generic blue icon with a small UI mock preview:

- **Vibrant Community Feed**
  - Mini post card with an avatar circle, name line, role badge (`Student`/`Industry`), and a row of reaction pills (👍 💡 🚀).
- **AI Career Roadmaps**
  - Compact roadmap milestone pill: "Target: Systems Engineer" + "6-Month Plan" badge.
- **Dynamic Discussions**
  - Clean threaded comment bubble preview: a parent comment and one nested reply with connector line.

These previews will be small presentational JSX components defined inside `Landing.tsx` (no new hooks or backend calls).

## Implementation Details
- **File to edit:** `src/pages/Landing.tsx` only.
- **Components to reuse:** `Button`, `Card`, `StudentBadge`, `RecruiterBadge`, `IndustryBadge`.
- **Design tokens:** use existing HSL semantic variables (`--primary`, `--secondary`, `--accent`, `--muted`, `--card`, etc.); avoid hardcoded colors.
- **Responsiveness:** keep container padding, stack CTAs on small screens, 3-column grid on `lg`.
- **Motion:** preserve existing `animate-fade-in-up` delays; add hover transitions only on presentational elements.

## Acceptance Criteria
- [ ] Hero shows one primary, one secondary, and one tertiary CTA with correct role URLs.
- [ ] Metric strip sits under the hero text and includes Students, Industry Mentors, and Recruiters counts.
- [ ] Pillar cards are equal height, have role badge tags, and include action micro-copy.
- [ ] Live Features cards show the three UI mock previews while keeping their descriptions.
- [ ] `npm run build` passes and mobile layout does not overflow or shift horizontally.
