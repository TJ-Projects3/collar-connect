## Fix spacebar page-scroll on comment inputs

### Current state (verified)
- `src/components/CommentInput.tsx` already calls `e.stopPropagation()` for Space on keydown (lines 49–60). Good.
- `src/components/CommentSection.tsx` **does not exist** in this project — the equivalent nested-reply input lives in `src/components/InlineReplies.tsx` (a `Textarea` at line 133) and has **no** keydown handler.
- `src/pages/Feed.tsx` has one `Textarea` (line 442), but it is `readOnly` and only opens the CreatePostModal on focus — it can't receive typed input, so it isn't the culprit.
- `src/components/ReplyModal.tsx` also contains a `Textarea` (line 216) with no keydown handler. Since it lives in a modal it's a lower-risk source, but for consistency we should cover it too.

The user's reported symptom (space scrolls the page while typing a comment) most plausibly comes from the nested-reply `Textarea` in `InlineReplies.tsx`, which currently has no space-stopPropagation guard.

### Changes

1. **`src/components/InlineReplies.tsx`** — add an `onKeyDown` handler to the nested-reply `Textarea` that calls `e.stopPropagation()` when the key is `" "` (Space). Keep existing behavior otherwise (no Enter-to-submit change, since replies here are multi-line).

2. **`src/components/ReplyModal.tsx`** — add the same Space `stopPropagation` guard to its `Textarea` for consistency, so the fix covers every comment/reply input surface.

3. **`src/components/CommentInput.tsx`** — no code change needed (already implements the guard), but re-verify the handler still fires after the edits.

### Out of scope
- The `Feed.tsx` top-of-feed `Textarea` is read-only and won't be modified.
- No business-logic or styling changes; this is a pure keydown-handler addition.

### Verification
- After edits, load `/feed`, type a comment containing spaces in (a) a top-level `CommentInput`, (b) an inline nested reply, and (c) the ReplyModal — page should not scroll.
- Confirm `bun run build` still passes.