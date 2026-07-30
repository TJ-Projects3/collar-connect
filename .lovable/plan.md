## Student Project Showcase

### 1. Database (one migration)

New table `public.student_projects`:
- `user_id`, `title`, `description`, `cover_image_url`, `tech_stack text[]`, `repo_url`, `live_url`
- `achievement_label` (student-entered, e.g. "Hackathon Winner"), `achievement_verified boolean default false`, `verified_by`, `verified_at`
- `shared_post_id` (links to the feed post created on cross-post), `display_order`, `created_at`, `updated_at` (+ update trigger)

Access rules:
- Anyone signed in can view projects; only the owner can create, edit, or delete their own.
- Only admins/moderators (via existing `has_role`) can set the verified flag — enforced with a trigger that reverts `achievement_verified` changes from non-admins (same pattern as `protect_verified_recruiter`).
- GRANTs for `authenticated` and `service_role`.

New `posts` column `project_id` (nullable, references `student_projects`) so the feed can identify and filter project posts.

Data migration: copy each profile's existing `featured_projects` JSON entries into `student_projects` so nothing is lost.

Cover images reuse the existing public `content-images` bucket.

### 2. Profile page — Projects tab

- Wrap the Profile body sections in tabs: **Overview** (current About / Portfolio / Experience content) and **Projects**.
- Projects tab renders a responsive grid (1 / 2 / 3 columns) of project cards showing: cover image (16:9, placeholder gradient when absent), title, clamped description, tech-stack badges, GitHub and Live Demo icon links, and a "Verified Achievement" badge when `achievement_verified` is true (muted, unverified style when a label exists but isn't verified yet).
- Owner-only controls on each card: edit, delete (with confirm), and "Share to feed".
- Empty states differ for own profile ("Add your first project") vs. visitors.
- The Developer Portfolio card keeps links + resume; its projects grid is removed and its modal loses the projects field array (projects now live in the new tab).

### 3. Add / Edit Project modal

React Hook Form + Zod, matching existing modal patterns:
- Title required (max 100), description max 500, tech stack as add/remove chips (max 15), repo/live URLs validated as http(s), achievement label optional (max 60).
- Cover image upload with type/size validation (jpg/png/webp, 5MB), preview, and remove.
- "Also share to the Community Feed" checkbox — when checked, creates a post whose content is the project title + description and stores its id in `shared_post_id`.
- Space-key `onKeyDownCapture` guards on all inputs, per existing convention.

### 4. Feed — Projects filter

- Add a segmented toggle above the feed: **All** / **Projects** (sits alongside the existing hashtag filter chip).
- "Projects" shows only posts with a non-null `project_id`.
- Project posts render a compact embedded project card (cover, title, tech tags, repo/demo links, verified badge) above the normal post text, and keep full like/comment/reaction behavior so peers and recruiters can give feedback.

### 5. Admin verification

Add a small "Project Achievements" section to the Admin page listing projects that have an `achievement_label` but aren't verified, with Verify / Unverify actions.

### Technical notes
- New files: `src/hooks/useStudentProjects.ts`, `src/components/projects/ProjectCard.tsx`, `ProjectFormModal.tsx`, `ProjectsGrid.tsx`, `FeedProjectEmbed.tsx`, `src/lib/project-validation.ts`.
- Modified: `src/pages/Profile.tsx`, `src/pages/Feed.tsx`, `src/hooks/usePosts.ts` (select `project_id` + joined project), `src/components/DeveloperPortfolioCard.tsx`, `DeveloperPortfolioModal.tsx`, `src/pages/Admin.tsx`.
- Query keys follow `["student-projects", userId]`; mutations invalidate projects and `["posts"]`.
