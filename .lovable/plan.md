# Update Landing Page for Three-Sided Platform

## Goal
Refactor `src/pages/Landing.tsx` so the homepage clearly positions NextGen Collar as a three-sided marketplace: Students, Industry Professionals/Mentors, and Recruiters.

## Changes

### 1. Hero Section
- Replace the subheadline under "Where Diverse Talent Meets Industry Excellence" with:
  > "Helping students map their tech careers, empowering industry mentors to share insights, and enabling recruiters to discover vetted, diverse talent."
- Add a third, secondary-style CTA next to the existing two main buttons:
  - Label: "Join as an Industry Mentor / Professional"
  - Action: navigate to `/auth?role=industry&mode=signup`
  - Style: outline variant, consistent hover/entrance animation with the recruiter CTA.

### 2. Three Pillars Section
- Rename section heading to: "Built for Students, Mentors & Recruiters."
- Update subtitle to:
  > "A complete ecosystem designed to launch careers, share industry wisdom, and hire top diverse talent."
- Replace the current 3-card value grid with an explicit 3-column / 3-role breakdown:
  - **Students** — "AI Career Roadmaps & Verified Portfolios" with description about personalized 6-month career maps, GitHub/portfolio projects, and discoverability.
  - **Industry Professionals** — "Mentorship & Community Leadership" with description about sharing insights, answering Q&A forum questions, and guiding engineers.
  - **Recruiters** — "Vetted Candidate Sourcing" with description about direct messaging and pre-vetted diverse talent.
- Keep existing card styling, hover effects, and staggered `animate-fade-in-up` entrance animations.
- Use existing semantic icons (or add a mentor/community icon from `lucide-react`) mapped to each role.

### 3. Live Features Section
- Update the "Vibrant Community Feed" card description to explicitly mention students, recruiters, and working industry professionals connecting together.

### 4. Consistency & Quality
- Preserve all existing Tailwind design tokens (`primary`, `secondary`, `accent`, `muted-foreground`, etc.).
- Keep responsive behavior: stacked CTAs on mobile, 1/2/3 column grids at appropriate breakpoints.
- Ensure no hardcoded colors or broken role badge references; this page does not render role badges, but the language should align with the Student / Industry / Recruiter taxonomy used across the app.

## Validation
- Run `npm run build` (or `tsc --noEmit` if build is heavy) to confirm no TypeScript errors.
- Visually verify the preview at desktop and mobile widths for the new 3-column pillar layout and stacked hero CTAs.
