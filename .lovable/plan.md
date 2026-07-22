
## Goal
Introduce two distinct profile types — **Student** and **Recruiter** — chosen from the landing page CTAs. Sign-in stays unified; signup and profile display adapt to the role.

## 1. Database (single migration)

Add a `profile_type` enum (separate from the existing `app_role` RBAC enum so we don't mix authorization roles with profile types):

- `CREATE TYPE public.profile_type AS ENUM ('student', 'recruiter');`

Extend `public.profiles`:
- `profile_type profile_type NOT NULL DEFAULT 'student'`
- Recruiter fields: `company_name text`, `company_title text`, `is_verified_recruiter boolean NOT NULL DEFAULT false`
- Student fields: `university text`, `major text`, `graduation_year int`, `gpa numeric(3,2)`
  (existing `github_url`, `resume_url`, `company` remain)

Update `handle_new_user()` to read `raw_user_meta_data->>'profile_type'` and insert it (fallback `'student'`). `is_verified_recruiter` stays false — only admins can flip it (add an RLS policy allowing `has_role(auth.uid(),'admin')` to UPDATE that column path; simplest: keep existing "users update own profile" policy but WITH CHECK prevents self-setting `is_verified_recruiter = true` unless admin — enforced via trigger).

No changes to `user_roles` / `app_role` (still admin/moderator/user for RBAC).

## 2. Routing & Signup

**Landing (`src/pages/Landing.tsx`)** — update the 4 CTA buttons:
- "Map Your Career" → `/auth?role=student&mode=signup`
- "Find Top Talent" → `/auth?role=recruiter&mode=signup`
- Header "Sign In" → `/auth?mode=signin`, "Join Now" → `/auth?mode=signup`

**Auth page (`src/pages/Auth.tsx`)**:
- Read `role` and `mode` from `useSearchParams`; default tab to signup when `role` present.
- Add role selector (segmented control) at top of signup form, prefilled from query param.
- Conditional signup fields:
  - Student: University, Major, Graduation Year (resume upload deferred to onboarding/profile edit for simplicity)
  - Recruiter: Company Name, Company Title
- Pass fields into `supabase.auth.signUp({ options: { data: { full_name, profile_type, university, major, graduation_year, company_name, company_title } } })`.
- Sign-in flow unchanged — always routes to `/feed`.

**Onboarding (`src/components/OnboardingModal.tsx`)**: extend to show role-appropriate fields when they're missing, so users who signed up before this change can fill them in.

## 3. UI — Badges & Post Headers

Create `src/components/RecruiterBadge.tsx` — small pill with `BadgeCheck` icon, label "Hiring Recruiter", uses `secondary` color token.

Create helper `src/lib/profile-display.ts` with `getProfileSubline(profile)`:
- Recruiter → `${company_title} @ ${company_name}` (or just company_name)
- Student → `${major} · ${university}` or `Class of ${graduation_year}`
- Fallback → existing `job_title`/`company` logic

Apply in:
- `src/pages/Feed.tsx` post headers
- `src/components/InlineReplies.tsx` reply author lines
- `src/components/ReplyModal.tsx` author line
- `src/pages/Profile.tsx` profile header (also render richer role-specific section — student's academic block vs. recruiter's company block)

Every place that renders a user's name (post header, reply, profile header, connections sidebar) also renders `<RecruiterBadge />` when `profile.profile_type === 'recruiter'`.

## 4. Types
After migration approval, regenerated `types.ts` will expose the new columns/enum — hooks (`useProfile`, `useAllProfiles`) need no changes since they `select("*")`.

## Out of scope
- Recruiter-only pages (talent search, job posting flows)
- Admin UI for flipping `is_verified_recruiter` (can be done via SQL for now)
- Migrating existing users' profile_type (defaults to 'student'; they can change via profile edit)

## Technical notes
- `profile_type` is a profile attribute (what kind of account), separate from `user_roles.role` which is RBAC (admin/moderator/user). Keeping them separate avoids privilege confusion.
- Query param `?role=recruiter` is a UX hint only; the actual value is written server-side via the `handle_new_user` trigger from `raw_user_meta_data`, so a user can't grant themselves recruiter verification through URL tampering.
