# Industry Mode: Companies & Professionals with Talent Access

Today the platform has exactly two personas (`student`, `recruiter`), and Talent Discovery at `/talent` is gated to recruiters and admins only. This adds a third persona — **industry** — covering career professionals *and* company/employer accounts who are part of the tech industry and legitimately need to browse talent, even though they aren't recruiters.

## Personas after this change

| Type | Who | Talent access |
|---|---|---|
| `student` | Students building a portfolio | No |
| `recruiter` | Hiring / talent acquisition | Full |
| `industry` | Engineers, managers, founders, company accounts | Yes, scoped (see below) |

## What "scoped" talent access means

Industry accounts get the same `/talent` page, but with guardrails so it doesn't become an open resume dump:

- Candidate cards show name, headline, school, grad year, skills, projects, endorsements.
- Resume download and contact email stay hidden — recruiter-only.
- "Message Candidate" becomes "Request Intro", which sends a DM only if the student has opted into industry contact.
- A per-day view/contact cap for industry accounts (recruiters unlimited).

## Company accounts

A company is an industry account with a company profile attached: logo, name, website, size, industry, short description, and a verified flag. Verification is a work-email domain match against the website domain, or admin approval — same pattern already used for recruiter verification. Unverified industry accounts get no talent access at all; the badge and the access both unlock on verification.

## Student control

Students get a single toggle in Settings: **"Visible to industry professionals & companies"** (on by default, same as current recruiter visibility). Off means industry accounts never see them; recruiters still do.

## Badge treatment

Reuse the existing high-contrast pill pattern from `RecruiterBadge`, in the secondary cyan instead of primary navy:
- Person: `Industry Professional · Senior SRE @ Cloudflare`
- Company: `Company · Cloudflare` with the logo inline and a checkmark when verified.

## Build order

1. **Schema** — extend `profile_type` enum with `industry`; add `industry_role_title`, `industry_company`, `industry_verified`, and `visible_to_industry` (default true) on `profiles`; new `companies` table with GRANTs + RLS, linked to an owning profile.
2. **Access layer** — replace the scattered `profile_type === "recruiter"` checks with a shared `canViewTalent` / `talentAccessLevel` helper in `src/lib/profile-display.ts`, used by `Navbar`, `Talent.tsx`, and `useTalentCandidates`.
3. **Query filtering** — `useTalentCandidates` respects `visible_to_industry` when the viewer is industry-tier.
4. **UI** — `IndustryBadge` component; field-level gating on `CandidateCard`; "Request Intro" flow; company profile form.
5. **Settings** — student visibility toggle, and add `industry` to the existing admin Developer Mode role switcher so you can test all three modes.

## Technical notes

- The enum change is additive, so existing `student`/`recruiter` rows are untouched.
- RLS on `student_projects`, `experiences`, and `profiles` needs new policies for the industry role — currently they assume recruiter-or-owner.
- Rate limiting is enforced in a `talent_access_log` table checked by an RPC, not client-side, since client checks are trivially bypassed.
