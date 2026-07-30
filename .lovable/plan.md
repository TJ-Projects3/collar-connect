## Recruiter Candidate Discovery (/talent)

A recruiter-only page for browsing student talent, with sidebar filters, candidate cards, and one-click messaging.

### Access
- New route `/talent`, protected. Visible only to profiles with `profile_type = 'recruiter'` or admins; students are redirected to `/feed`.
- Nav link ("Talent") added for recruiters/admins only.

### Database
- Add `availability` to `profiles` (enum: `summer_intern`, `fall_coop`, `part_time`, `full_time_new_grad`, `not_looking`), nullable.
- Students set it in the profile edit / onboarding form (a simple select). No other new fields.
- Candidate data comes from existing tables: `profiles` (name, avatar, university, major, graduation year) + `student_projects` (tech stack, cover image, verified achievements).

### Filters (sidebar)
- **Tech Stack** — multi-select checkbox list built from the distinct `tech_stack` values across student projects, with a search box.
- **Graduation Year** — multi-select of years present in the data.
- **University** — searchable multi-select of universities present in the data.
- **Work Availability** — multi-select of the availability options.
- Plus a name/keyword search field, active-filter chips, and a "Clear all" action.
- Filtering runs client-side over one batched fetch (student profiles + their projects), so results update instantly. Collapsible sidebar on desktop, a filter sheet/drawer on mobile.

### Candidate cards (responsive grid)
Each card shows:
- Avatar, full name, university · major · class of {graduation year}
- Gold **NextGen Verified Intern** badge when the student has at least one project with a verified achievement
- Availability pill (e.g. "Summer Intern")
- Top skill tags — up to 5, aggregated from their projects' tech stacks, ranked by frequency, with "+N more"
- Thumbnail preview of their top project (cover image, or an initials/gradient placeholder), with project title
- **Message Candidate** button — creates/opens the DM thread via the existing `send_dm` flow and navigates to `/messages?recipientId=<studentId>`, matching how the profile page does it
- Secondary "View profile" link to `/profile?userId=<studentId>`
- Empty state when filters match nothing, and skeleton cards while loading

### Technical notes
- New `src/hooks/useTalentCandidates.ts`: fetches student profiles and their projects, and returns candidates with derived skills, top project, and verified-intern status, plus the available filter option lists.
- New components: `src/pages/Talent.tsx`, `src/components/talent/TalentFilters.tsx`, `src/components/talent/CandidateCard.tsx`.
- Reuses existing messaging hooks; no changes to messaging logic.
- Existing RLS already restricts `profiles` and `student_projects` reads to authenticated users; the recruiter gate is a UI/route guard, not a data-visibility change.
- Page title/meta and a single H1 set for SEO.
