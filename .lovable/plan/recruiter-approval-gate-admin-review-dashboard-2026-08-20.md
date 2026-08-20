# Recruiter Approval Gate + Admin Review Dashboard

Most of the foundation already exists: recruiter signup collects company name, title, work email, company website, LinkedIn, and hiring roles; `profiles.recruiter_status` (pending / approved / rejected) is live; database rules already block unapproved recruiters from candidate search, direct messages, and posting; and Tia Crawford (tia@nextgencollar.com) already holds the admin role. There is one recruiter in the system today, still pending.

What is missing: a full-screen "Pending Admin Approval" experience, a dedicated review dashboard, and the status email.

## 1. Pending approval screen

A pending or rejected recruiter currently gets the normal app with individual features blocked. Instead, they will land on a single clean full-page screen:

- Headline "Pending admin approval", with the company name they submitted.
- Plain-English note that Ms. Tia is verifying the account and that candidate search, messaging, and posting unlock on approval.
- A read-only recap of what they submitted (company, title, work email, website, LinkedIn) so they can spot a typo.
- Buttons: "Edit my details" (goes to Settings), "Refresh status", and "Sign out".
- Rejected accounts see a distinct message and a support contact line instead of the waiting copy.

This gate wraps every signed-in route, with Settings left reachable so they can correct their credentials. Admins are never gated.

## 2. Admin review dashboard

A new admin-only page at `/admin/recruiters`, also surfaced as a "Recruiters" tab inside the existing Admin Dashboard.

- Access is by admin role in the database (Tia already has it), not by a hardcoded email list — an email check in frontend code can be spoofed and would break if her address changes. Admins are managed in the roles table.
- Sections: Pending review (default), plus Approved and Rejected for history.
- Each row shows avatar, name, company and title, work email (click to mail), company website, LinkedIn link, roles they're hiring for, and signup date.
- One-click "Approve" and "Reject" buttons with a short confirmation, updating `recruiter_status` immediately and refreshing the list.

## 3. Automated status email via Resend

Approve and Reject each send the recruiter an email from the existing verified `nextgencollar.com` sender:

- Approved: account is live, with a link to candidate search.
- Rejected: account was not approved, with a reply-to address for questions.

Both are sent through a new server-side function so the Resend key stays off the browser. The function verifies the caller is a signed-in admin, applies the status change, sends the email, and records the send in the existing email log. If the email fails, the status change still stands and the dashboard shows a warning rather than silently failing.

## Technical notes

- New `RecruiterPendingGate` component composed inside `ProtectedRoute` / `OnboardingWrapper`; allowlists `/settings` and `/auth`.
- New page `src/pages/RecruiterReview.tsx` + `src/hooks/useRecruiterReview.ts` (list + approve/reject mutation), and a `RecruitersTab` entry in `src/pages/Admin.tsx`.
- New edge function `supabase/functions/recruiter-status/index.ts`: validates the JWT, checks `has_role(uid,'admin')`, updates `recruiter_status` with the service role, sends via Resend, inserts into `email_logs`.
- Recruiter emails come from `auth.users`, which the browser can't read, so the function resolves the address server-side via the existing `get_user_email` helper.
- No schema migration needed: `recruiter_status`, the `protect_verified_recruiter` trigger (admin-only status changes, keeps `is_verified_recruiter` in sync), and `recruiter_blocked` RLS gating are already in place.
