# App Store Compliance: Account Deletion, Reporting, Blocking

Three compliance features: self-serve account deletion, content reporting on all user-generated content, and user blocking that immediately hides blocked people's content.

## 1. Account deletion

- Settings → Data & Privacy: the existing "Delete Account" placeholder button becomes live, styled as a destructive action.
- Clicking opens a confirmation modal that explains the deletion is permanent, lists what gets removed (profile, posts, comments, Q&A, messages, connections, projects), and requires typing `DELETE` to enable the confirm button.
- Confirming calls a new secure edge function that deletes the account. Deletion removes the auth user; all app data tied to that user is removed along with it.
- On success the app signs the user out and returns to the landing page with a confirmation message.

## 2. Reporting user-generated content

- A 3-dot menu is added to: feed posts, inline replies/comments, Q&A questions, and Q&A answers.
- Menu options: "Report post/comment/question/answer", "Block user" (hidden on your own content), and for your own content the existing delete action moves into this menu where one exists today.
- Report opens a small dialog with a reason picker (Spam, Harassment or hate, Sexual content, Violence, Misinformation, Other) plus an optional detail box. Submitting stores the report and shows a "Thanks — our team will review this" toast.
- Reports are visible to admins in a new "Reports" tab on the Admin page: reporter, reported content preview, reason, date, plus actions to dismiss the report or remove the content.

## 3. Blocking users

- "Block user" appears in the content 3-dot menus and on profile cards (profile page header, candidate cards, connections/network cards).
- Blocking asks for a quick confirmation, then takes effect immediately: their posts, replies, questions, answers, and connection requests disappear from your views, and they can no longer message you.
- Blocking is one-directional from the viewer's perspective but hides content both ways so neither party sees the other.
- Settings → "Manage Blocked Users" opens a list of everyone you've blocked with an "Unblock" button.

## Technical notes

Database migration:
- `content_reports` (reporter_id, target_type enum: post/reply/question/answer, target_id, reason enum, details, status enum: open/reviewed/dismissed, created_at). RLS: reporters insert their own and read their own; admins/moderators read and update all. Grants for `authenticated` + `service_role`.
- `blocked_users` (blocker_id, blocked_id, created_at, unique pair). RLS: owner-only full access. Grants for `authenticated` + `service_role`.
- Helper `public.is_blocked(_a uuid, _b uuid)` security-definer function returning true when either direction blocked; used to tighten `messages` insert policy so blocked pairs can't DM.
- Cascade check: confirm every user-referencing table (`posts`, `post_replies`, `post_likes`, `questions`, `question_answers`, `question_votes`, `messages`, `conversation_participants`, `user_connections`, `student_projects`, `experiences`, `career_assessments`, `notifications`, `email_*`, `talent_access_log`, `companies`, `student_endorsements`, `memberships`, `user_roles`, `profiles`) has `ON DELETE CASCADE` to `auth.users`/`profiles`, and add it where missing so auth-user deletion leaves no orphans.

Edge function `delete-account`:
- Validates the caller's JWT, derives the user id from the token only (never from the request body), then deletes via the admin API with the service-role key. Returns CORS headers on every response.

Frontend:
- `src/hooks/useBlockedUsers.ts` (list/block/unblock, cached set of blocked ids), `src/hooks/useContentReports.ts` (submit + admin list/resolve), `src/hooks/useDeleteAccount.ts`.
- New components: `ContentActionsMenu.tsx` (shared 3-dot dropdown with report/block/delete), `ReportContentDialog.tsx`, `BlockUserDialog.tsx`, `DeleteAccountDialog.tsx`, `BlockedUsersDialog.tsx`, `admin/ReportsTab.tsx`.
- Client-side filtering of blocked authors in `usePosts`, `usePostReplies`, `useQuestions`, `useConnections`, and `useTalentCandidates` so hiding is instant after a block.
- Wire menus into `Feed.tsx`, `InlineReplies.tsx`, `Community.tsx`, and profile/candidate cards; wire the two Settings buttons.
