# Clean @Name display in mention inputs

## Goal

When someone picks a person from the @mention list, the input should show a highlighted `@Name` instead of the raw `@[Name](long-id)` text. The hidden ID still travels with the post/comment/message when it is submitted, so mention notifications and profile links keep working exactly as they do now.

## What changes

All four places that support mentions get the same behaviour:

- New post box
- Comment box
- Reply box
- Direct message / group message box

Behaviour:

1. Typing `@` and choosing a person inserts a clean `@Name` in the field, visually highlighted in the brand colour so it reads as a tag.
2. The caret lands right after the inserted name, as it does today.
3. Backspacing at the end of a mention deletes the whole mention in one step instead of leaving broken fragments.
4. Plain typing, pasting, selecting, and deleting elsewhere in the text behave normally.
5. On submit, the message sent to the server still carries the hidden person ID, so the tagged person is notified and the name links to their profile in the posted content.
6. Existing posts, comments, and messages are unaffected; nothing in the database changes.

## Technical approach

All work is frontend only, centred on `src/components/mentions/MentionTextarea.tsx` and `src/lib/mentions.ts`. No schema, RLS, trigger, or Edge Function changes.

### Raw vs. display text

The component keeps owning the raw value (`@[Name](uuid)`) that the parent already passes in and submits. Internally it derives a display string where each marker is replaced by `@Name`, and renders that in the textarea.

Add to `src/lib/mentions.ts`:

- `toDisplayText(raw)` — returns `{ display, segments }`, where each segment records `rawStart`, `rawEnd`, `displayStart`, `displayEnd` and whether it is a mention.
- `mapDisplayIndexToRaw(segments, displayIndex)` — index translation used for caret and edit mapping.
- `applyDisplayEdit(raw, prevDisplay, nextDisplay)` — diffs the previous and next display strings by common prefix/suffix, translates the changed display range to a raw range through the segment map, and splices the typed text into the raw value. Any mention whose display span is partially touched is removed whole, which gives the atomic-delete behaviour.

### Component updates

- `onChange` now runs `applyDisplayEdit` and calls `onValueChange` with the updated raw value; mention-query detection continues to run against the display text.
- Insertion builds the marker with `buildMentionToken` as today, splices it into the raw value at the raw offset mapped from the display range, then places the caret using the recomputed display offsets.
- A read-only highlight overlay sits directly behind the textarea: same font, padding, and wrapping, with the textarea background transparent. The overlay prints the display text with each mention wrapped in a rounded pill (`bg-primary/10 text-primary`), scroll-synced to the textarea. Plain-text metrics stay identical, so the caret continues to line up.
- The suggestion dropdown, keyboard navigation, connection-first ordering, and blur handling are unchanged.

### Verification

- TypeScript check.
- Type, insert, delete, and mid-text edit cases exercised in the running app for post, comment, reply, and message fields, confirming the submitted payload still contains the ID marker.
