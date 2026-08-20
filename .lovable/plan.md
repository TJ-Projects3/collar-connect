# Industry Professional & Recruiter Profile UI

Today these role fields only exist as blur-saved inputs buried in Settings, and the profile page shows a badge but no role-specific detail card. This adds proper edit modals and display sections on the profile page for both roles.

## 1. Industry Professional

**Edit modal** (opened from a "Complete your industry profile" / "Edit" button on the profile page, own profile only):
- Headline (stored in the existing `job_title` field)
- Current Company, Job Title, Years of Experience
- Areas of Expertise as multi-select chips (type or pick from a suggested tech/industry list, remove with an x) instead of the current comma-separated text box
- Portfolio, GitHub, LinkedIn links (reuses the existing URL normalization/validation helpers)
- "Willing to Mentor Students" toggle

**Display card** on the profile Overview tab:
- Headline + role @ company, years of experience, expertise chips, link buttons
- Mentor availability line when the toggle is on

**Badge:** the header pill reads "Industry Mentor" when mentorship is on, otherwise "Industry Professional", with the verified checkmark only when the account is verified.

## 2. Recruiter

**Edit modal** (own profile only):
- Company Name, Official Work Email, Company Website, Recruiter LinkedIn
- Active Roles Hiring For as multi-select chips (replacing the comma-separated field)

**Display card** on the profile Overview tab:
- Company name and website, roles currently hiring for as chips, LinkedIn link
- Work email shown to the recruiter themself and to admins only
- A clear "Pending review" / "Not approved" state instead of the recruiter detail card when the account is not approved yet

**Badge fix:** the header currently renders "Verified Recruiter" for every recruiter regardless of approval state. It will show "Verified Recruiter" only when `recruiter_status = 'approved'`, and a muted "Recruiter · Pending review" pill otherwise.

## Technical notes

- No database changes: all fields already exist on `profiles` (`job_title`, `current_company`, `current_role`, `years_of_experience`, `areas_of_expertise`, `mentorship_opt_in`, `portfolio_url`, `github_url`, `linkedin_url`, `company_name`, `company_email`, `company_website`, `hiring_roles`, `recruiter_status`, `industry_verified`).
- New files: `src/components/industry/IndustryProfileModal.tsx`, `src/components/industry/IndustryProfileCard.tsx`, `src/components/recruiter/RecruiterProfileModal.tsx`, `src/components/recruiter/RecruiterProfileCard.tsx`, and a small reusable `ChipsInput` for the multi-select fields.
- Modals use React Hook Form + Zod and `useUpdateProfile`, matching `DeveloperPortfolioModal`.
- `Profile.tsx` renders the role-appropriate card in the Overview tab (industry/recruiter cards replace the developer portfolio card for those roles); `IndustryBadge` and `RecruiterBadge` get the label/approval changes.
- The Settings role fields stay as-is so the existing flow keeps working.
