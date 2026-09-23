# 2-Step Role-Based Onboarding

Replace the current single-screen onboarding form with a clean two-step flow that asks for the person's role first, then only the fields that matter for that role.

## Step 1 — Pick a role

Three tappable cards (stacked on mobile, side-by-side on larger screens), each with an icon, title and one-line description:

- Student / Early Career — "Build your profile, find internships and mentors."
- Industry Professional / Mentor — "Share expertise, mentor students, grow your network."
- Recruiter / Talent Lead — "Discover student talent and post roles."

Selecting a card highlights it and advances to Step 2. Recruiters see a short note that recruiter accounts are reviewed before talent search unlocks (this matches how the account status already works today).

## Step 2 — Details

Everyone sees: profile photo upload, Full Name (required), Headline, Location.

Then, based on the Step 1 choice:

- Student: School / Bootcamp, Major, Expected Graduation (month + year).
- Mentor: Current Company, Tech Domain (multi-select chips), "Open to mentorship" toggle.
- Recruiter: Hiring Company, Roles You Hire For (multi-select chips).

A back button returns to Step 1; a progress indicator ("Step 1 of 2") sits in the header. Saving writes the role plus the filled fields in one update and closes the modal.

## Making onboarding actually appear

Right now the completion check always returns "complete", so the onboarding modal never shows for anyone. It will be changed to treat a profile as incomplete when the name is blank, so new signups get the flow. Existing users with a name are unaffected.

## Database

No schema change needed — every field already exists on the profiles table: `profile_type`, `university`, `major`, `graduation_year`, `graduation_month`, `current_company`, `areas_of_expertise`, `mentorship_opt_in`, `company_name`, `hiring_roles`, plus name/headline/location/avatar.

## Technical notes

- Rewrite `src/components/OnboardingModal.tsx` as a two-step component with local `step` state and a role-conditional Zod schema; keeps `useUpdateProfile` + `useUploadAvatar` as today.
- Reuse `ChipsInput` for Tech Domain and Roles You Hire For, `Switch` for the mentorship toggle, and the `MONTHS` / `HIRING_FOCUS_SUGGESTIONS` / expertise option lists from `src/lib/profile-options.ts` (adding a tech-domain suggestion list there if none fits).
- Dialog stays non-dismissable (no outside click / escape), scrollable on small screens, footer buttons via the existing modal action pattern.
- `isProfileComplete` in `src/hooks/useProfile.ts` returns `!!profile?.full_name?.trim()`; `OnboardingWrapper` is unchanged.
- Recruiter approval state is untouched — `recruiter_status` keeps its `pending` default.
