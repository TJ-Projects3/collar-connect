# Three Roles + Recruiter Approval Gating

Keep one role field (`profiles.profile_type`, already `student | recruiter | industry`) and treat `industry` as the industry professional persona. Replace the recruiter boolean with a three-state approval status, add the requested role-specific fields, and enforce the pending-recruiter restrictions in the database.

## 1. Profile fields

Industry professional:
- `years_of_experience` (int), `current_company` (text), `current_role` (text), `mentorship_opt_in` (boolean, default false), `areas_of_expertise` (text array, default empty)
- The existing `industry_company` / `industry_role_title` stay and are backfilled into `current_company` / `current_role`, so today's badges keep working.

Recruiter:
- `company_email`, `hiring_roles` (text array), `company_website`, `linkedin_url` — `company_name` already exists and is reused.

Approval:
- New `recruiter_status` enum (`pending` / `approved` / `rejected`), default `pending`.
- Backfilled from `is_verified_recruiter` (true -> approved, otherwise pending). The old boolean is kept in sync by trigger for one release so nothing breaks mid-deploy, and the admin verification tab writes `recruiter_status` from now on.

## 2. Pending recruiters are blocked

A `security definer` helper (`public.recruiter_blocked(uid)`) returns true when the user is a recruiter whose status is not `approved`. It is applied so pending recruiters cannot:

- **Search students** — student profile rows and `student_projects` become invisible to them (talent discovery returns nothing).
- **Send direct messages** — the insert policy on `messages` and the `send_dm` function both reject them.
- **Post announcements** — the insert policy on `posts` rejects them.

Approved recruiters, students, industry accounts, and admins are unaffected.

## 3. App-side changes

- `useProfile` / talent access helpers read `recruiter_status`; `canViewTalent` requires `approved` for recruiters.
- Signup collects the new recruiter fields (company email, website, LinkedIn, hiring roles) and the industry fields (years of experience, company, role, expertise, mentorship opt-in).
- Settings gains inputs for the new industry and recruiter fields.
- A clear "pending review" banner replaces the talent page, the message composer, and the post composer for pending recruiters, plus a friendly message for rejected accounts.
- Admin verification tab switches to Approve / Reject buttons driven by `recruiter_status`.

## Technical notes

- One migration: enum creation, columns with safe defaults, backfill, GRANT-preserving `ALTER`s (no new tables), the helper function, and the replaced RLS policies.
- Profile read policy is split so non-student rows stay readable to everyone while student rows are hidden from blocked recruiters — this keeps the feed, messaging, and network pages working.
- Client-side gating is UX only; enforcement lives in RLS and `send_dm`.
