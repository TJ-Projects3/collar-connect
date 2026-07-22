## Goal

Allow images and GIFs on top-level posts (not just comment replies), and ensure media uploads/rendering work reliably on Windows, Android, and Linux — not just Apple devices.

## Part 1 — Media on Main Posts

### Database (migration)
Add media columns to `posts`, mirroring `post_replies`:
- `media_url TEXT NULL`
- `media_type TEXT NULL` with CHECK (`media_type IN ('image','gif')` or NULL)

No new RLS needed — existing insert/update policies on `posts` already scope by `author_id = auth.uid()`. The existing `content-images` storage bucket (public) is already used by comments and works for posts too; no new bucket or policy required.

### Hook — `src/hooks/usePosts.ts`
- `useCreatePost` accepts `{ content, mediaUrl?, mediaType? }` instead of a bare string and inserts the new columns.

### UI — `src/components/CreatePostModal.tsx`
- Add the same composer affordances used in `CommentInput.tsx`:
  - Image upload button (`<input type="file" accept="image/*">`, hidden, triggered by a Button).
  - GIF button that opens `<GifPicker />`.
  - Preview thumbnail with a remove (X) button.
- Reuse the existing `content-images` bucket with path `posts/{userId}/{uuid}.{ext}`.
- Allow submitting media-only posts (content OR media required, not both).
- Reset media state on close/submit.

### UI — `src/pages/Feed.tsx`
- Render `post.media_url` under the post content using the same `<img>` pattern used in `InlineReplies.tsx` (standard `<img>` inside an `<a>` link, `object-contain`, rounded border).

## Part 2 — Cross-Platform Compatibility Fix

The current comment composer already uses standard HTML5 `<input type="file" accept="image/*">`, standard `<img>` tags, and Radix Popover (which handles pointer events cross-browser), so most of it is already portable. The likely real causes of the "only works on Apple" reports are:

1. **Hidden file input triggered via `ref.current?.click()` inside a Radix Popover / Dialog** — on Chrome/Edge/Firefox on Windows and Android, a synthetic `.click()` on an input that is `display:none` inside certain focus-trapped containers can be ignored. Fix by rendering the file input as a visually-hidden but focusable element (using `sr-only` positioning: `absolute`, `w-px h-px`, `opacity-0`, `pointer-events-none`) instead of `hidden`, and by wrapping the trigger in a `<label htmlFor="...">` so the browser fires the native file dialog directly — no JS click required. This is the standard cross-browser pattern.
2. **`accept="image/*"` on Android** correctly opens gallery + camera; keep it, but also add `capture` omitted (so gallery is default) and ensure the input is not `disabled` when a GIF picker is open on mobile.
3. **GIF rendering**: KLIPY sometimes returns `.webp`/`.mp4` variants. On Windows/Android Chrome, `.mp4` won't render inside `<img>`. Ensure the GIF picker and reply/post renderer only ever store a `.gif` or `.webp` URL (the edge function already returns `preview`/`url` — verify we're picking the `gif` URL, not `mp4`, and render with `<img>` only).
4. **Touch events**: All interactive elements already use `<Button>` (which uses `onClick`, working for both mouse and touch). No `onMouseDown`-only handlers to change. Audit `CommentInput.tsx`, `GifPicker.tsx`, and the new post composer to confirm — no code change expected beyond confirmation.
5. **CSS**: Remove any `-webkit-` only rules if found in `index.css` around media (none expected; will confirm during build).

### Files touched for Part 2
- `src/components/CommentInput.tsx` — swap hidden file input for `<label>` + `sr-only` input pattern.
- New post composer (`CreatePostModal.tsx`) — same pattern from the start.
- `src/components/GifPicker.tsx` / `supabase/functions/klipy-gifs/index.ts` — verify returned `url` prefers `gif`/`webp`, never `mp4`; add a fallback chain.

## Out of scope
- No changes to auth, RLS beyond the new columns, or the notifications system.
- No new storage bucket.

## Technical summary
```text
Migration:
  ALTER TABLE public.posts
    ADD COLUMN media_url TEXT,
    ADD COLUMN media_type TEXT
    CHECK (media_type IN ('image','gif') OR media_type IS NULL);

Frontend:
  usePosts.useCreatePost({ content, mediaUrl?, mediaType? })
  CreatePostModal → image upload + GifPicker + preview
  Feed post card → render media_url below content
  CommentInput + CreatePostModal → <label htmlFor> pattern for file input
```
