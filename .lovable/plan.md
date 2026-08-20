# AI Thread Summaries + Recommended Peers

## 1. Q&A Thread Auto-Summarization

- On a question detail page in Community, show a **Summarize Discussion** button when the thread has 3+ answers (below that, a summary adds nothing).
- Clicking it calls a new `summarize-thread` Edge Function with the question title/body and all answer bodies. The function returns exactly 3 short bullets plus a one-line takeaway.
- The result renders in a collapsible card pinned above the question: "AI Summary" header, 3 bullets, collapse/expand toggle, and a "Regenerate" action. While loading it shows a skeleton; gateway errors surface as an inline message (credits/rate-limit text passed through).
- Summaries are cached in a new `question_summaries` table keyed by question id, storing the bullets plus the answer count they were generated from. If new answers arrived since, the card shows "New replies since this summary" with the regenerate action. Anyone can read a cached summary; only signed-in users can trigger generation.
- Anonymous answers are included as content but authors are never named in the summary prompt or output.

## 2. Recommended Peers

- New "Recommended Peers" card showing up to 5 student profiles, with avatar, name, university/major line, the matching signal ("Same grad year", "Also into React, Python"), and View/Connect actions.
- Placement: Community page right sidebar (desktop) and the Feed sidebar, visible only to student-type users. Hidden on mobile sidebars, consistent with the existing sidebar behavior.
- Matching is scored client-side over student profiles: overlapping skills/areas of expertise (highest weight), same target roles, same graduation year, then same university/major as a tiebreak. Profiles with no signal in common are excluded rather than padded with random users.
- Excludes the current user, blocked users, and people already connected or with a pending request. Empty state offers a link to browse the network.

## Technical notes

- `supabase/functions/summarize-thread/index.ts` follows the existing `career-roadmap` pattern: `createLovableAiGatewayProvider` from `_shared/ai-gateway.ts`, `openai/gpt-5.6-sol`, `Output.object` with a zod schema `{ bullets: string[3], takeaway: string }`, CORS headers, JWT validated in code before generating, and answers truncated to a token-safe budget.
- Migration: `question_summaries` (question_id PK/FK to questions, bullets jsonb, takeaway text, answer_count int, created_at, updated_at) with GRANTs for anon select / authenticated select+insert+update / service_role all, RLS enabled.
- New hooks: `useThreadSummary(questionId)` (read cache) + `useSummarizeThread()` (invoke function, write cache, invalidate) and `useRecommendedPeers()` (derives from `useAllProfiles`, `useConnections`, `useBlockedUsers`, memoized scoring).
- New components: `src/components/community/ThreadSummaryCard.tsx`, `src/components/community/RecommendedPeersCard.tsx`. No changes to existing Q&A data hooks beyond wiring.
