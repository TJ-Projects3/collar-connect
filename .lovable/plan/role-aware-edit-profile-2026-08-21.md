# Role-Aware Edit Profile

Today "Edit Profile" (the button on the profile page) shows the same six generic fields for everyone: name, job title, company, location, bio, website. Role-specific fields live scattered across Settings and the separate industry/recruiter modals. This makes one modal that adapts to the signed-in user's role, and adds the missing columns to `profiles`.

## 1. Shared section (all roles)

Avatar, Full Name, Headline, Location, Bio, Website — unchanged behavior, kept at the top.

## 2. Student section

- Academic details: University/Institution, Major/Degree, Expected Graduation as a Month + Year pair (renders as "May 2027").
- Technical skills & tools: pill multi-select with suggestions (Java, Python, JavaScript/TypeScript, React, Node, SQL, Docker, Kubernetes, AWS, Git, Linux, C++, Go, Figma).
- Career track & target roles: multi-select populated from the 16 Career Mapping tracks so the profile and the roadmap speak the same language.
- Work status: availability tags (Seeking Internships, Seeking Co-op, Seeking Full-Time, Not Looking) and a single work authorization choice (US Citizen, Permanent Resident, Visa Holder, Needs Sponsorship).

## 3. Industry professional / mentor section

- Mentorship offerings: pill multi-select (Code Reviews, Resume Roasting, Mock Interviews, System Design, Career Transitions, Portfolio Feedback, Referrals).
- Scheduling link: Calendly / Cal.com / any booking URL, normalized and validated like the other links.
- Experience level: seniority selector (Mid-Level, Senior, Staff/Lead, Principal, Executive).
- Existing industry fields (current company, role title, years of experience, areas of expertise, mentor toggle) move into this section so there is one place to edit them.

## 4. Recruiter section

- Verified company details: Company Name, official work email, work email domain, Company Website.
- Hiring focus: target roles hired for (multi-select) plus work types (Remote, Hybrid, On-Site).
- Company job listings: a section listing that recruiter's active postings from the Jobs board with links, plus a "Post a job" / "Manage listings" action. Read-only inside the modal — no job editing there.
- Work email and domain stay visible only to the recruiter themself and admins.

## 5. Profile header

Student headers gain an academic tag row directly under the headline/location: graduation-cap pill for University · Major, an "Expected May 2027" pill, and availability pills. Skills and target tracks render as chips in the profile body card, not the header.

## Database changes

New nullable columns on `profiles` (single migration, defaults so existing rows stay valid):

- `technical_skills text[] default '{}'`
- `target_tracks text[] default '{}'`
- `work_status text[] default '{}'`
- `work_authorization text`
- `graduation_month smallint` (1-12, validated by trigger; pairs with existing `graduation_year`)
- `mentorship_offerings text[] default '{}'`
- `booking_url text`
- `seniority_level text`
- `hiring_work_types text[] default '{}'`
- `company_email_domain text`

Existing columns reused as-is: `university`, `major`, `graduation_year`, `areas_of_expertise`, `mentorship_opt_in`, `current_company`, `current_role`, `years_of_experience`, `company_name`, `company_email`, `company_website`, `hiring_roles`, `availability`. No RLS or grant changes needed — the profile update policies already cover these columns; new array/text columns are readable under the current profile select policy.

## Technical notes

- `src/components/ProfileButton.tsx` becomes a role-aware modal: one Zod schema with a shared block plus role blocks resolved from `profile.profile_type`, submitting a single `useUpdateProfile` call. Reuses `ChipsInput` for every multi-select and `normalizeUrl` for the booking/website links.
- Long form gets grouped sections with headings inside the existing scrollable dialog; mobile keeps single-column stacking and `ModalActions` for the footer.
- New shared constants file for skill/track/offering/authorization option lists, with tracks derived from `src/lib/career-scoring.ts` so they can't drift.
- `src/pages/Profile.tsx` renders the new student academic tag row and skill/track chips; the existing `IndustryProfileCard` and `RecruiterProfileCard` gain the new fields (offerings, booking link, seniority; work types, job listings link).
- The standalone `IndustryProfileModal` / `RecruiterProfileModal` keep working; their entry points now open the unified Edit Profile modal instead, so there is a single edit surface.
- Types in `src/integrations/supabase/types.ts` regenerate after the migration runs; UI work follows that.
