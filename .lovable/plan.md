# Mentorship Booking + Q&A Sidebar & Accepted Answers

## 1. Mentorship booking flow

New `MentorshipButton` component, shown wherever a mentor (profile_type `industry`, mentorship opted-in) appears:

- Profile page action row (viewing someone else's industry profile) and the Industry profile card.
- Q&A answer cards where the answer author is a mentor (non-anonymous).

Behavior:
- Mentor has a `booking_url` (Calendly/Cal.com): button opens a confirm modal showing the mentor's name, mentorship offerings, and an "Open scheduling page" action that opens the link in a new tab.
- No booking URL: opens a "Request Mentorship" modal where the student picks one or more topics (Code Review, Resume Roast, Career Guidance, Interview Prep, Portfolio Feedback, Industry Insights) plus an optional short note. Submitting sends a formatted direct message to the mentor through the existing `send_dm` flow, which already fires the message notification (in-app + email). On success: toast, modal closes, optional link to the conversation.

No new tables — the request rides on existing messaging/notifications.

## 2. Accepted answers

Question authors can already accept an answer and answers already sort accepted-first. Completing it:

- Add a compact green check icon-button on each answer (clearer than the current text button), tooltip "Mark as accepted answer".
- Show the accepted answer visually pinned at the top with a green "Accepted Answer" badge and a green-tinted card border/background.
- Extend permission to admins and moderators: the current update policy on answers only allows the answer author or question author, so admins can't accept. This needs a database policy addition.

## 3. Q&A sidebar widgets (`/community`)

Right 3-column sidebar gains two widgets above the existing recommended peers card:

- **Trending Topics** — aggregates tags across recent questions and shows the most used ones as clickable pills with counts. Clicking sets a tag filter on the Q&A list (URL param `tag=`), with an active pill state and a "Clear" affordance. The question list filters to questions containing that tag.
- **Top Mentors** — industry professionals who opted into mentorship, ranked by Q&A answer activity, each row showing avatar, name, role line, a role badge, and a one-click link to their profile. Includes the mentorship button when a booking URL exists.

Both widgets also render on mobile below the question list so mobile users aren't cut off from them.

## Technical notes

- Database migration: add an UPDATE policy on `public.question_answers` allowing `has_role(auth.uid(),'admin')` / `'moderator'` so moderators can accept/unaccept.
- New hooks: `useQuestionTagCounts()` (tags from questions in the last 60 days, aggregated client-side) and `useTopMentors()` (industry + `mentorship_opt_in` profiles joined with answer counts).
- New components: `src/components/mentorship/MentorshipButton.tsx`, `MentorshipRequestModal.tsx`, `src/components/community/TrendingTagsCard.tsx`, `TopMentorsCard.tsx`.
- Edits: `src/pages/Community.tsx` (tag filter param, sidebar, accepted-answer styling, mentor button on answers), `src/pages/Profile.tsx` and `src/components/industry/IndustryProfileCard.tsx` (mentorship button), `src/hooks/useQuestions.ts` (accept permission awareness via existing admin role hook).
- Reuses `useSendMessage`, `useAdminRole`, `RoleBadge`, and existing design tokens — no hardcoded colors; the accepted-answer green uses a semantic token.
