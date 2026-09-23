# Mention Pill Layout Fix + Emoji Picker

## 1. Fix the stacked @mention name

The highlight layer that paints the blue mention text sits on top of the input and is currently laid out as a flex row. That makes every piece of text (including each mention) its own flex item, which is why "@Tia" and "Crawford" get pushed onto separate lines and spacing looks off.

Fix:
- Change the highlight layer to normal text flow (block, wrapping like the typed text) instead of a flex row.
- Style the mention itself as `inline-flex`, row direction, centered, `whitespace-nowrap`, inherited font size and line height, no extra padding or margin, so the full name stays on one line and sits flush with the surrounding text.
- Keep the layer's font metrics identical to the input so the visible text stays perfectly aligned with the real cursor.
- This fixes every place that uses the shared input: post creator, comments, reply box, and direct/group messages.

## 2. Emoji picker

- Add a reusable emoji picker popover (categorised: smileys, people, gestures, hearts/reactions, objects) with a small search field, built with the existing popover UI and design tokens.
- Comment input: the smiley icon currently opens the GIF picker. The smiley will now open the emoji picker, and the GIF picker moves to its own clearly labelled "GIF" button next to it so both stay available.
- Post creator: connect its smiley icon to the same emoji picker.
- Selecting an emoji inserts it at the current cursor position (or replaces the selected text), then returns focus to the field with the cursor right after the emoji — it never wipes existing text or appends to the end.

## Technical notes

- Root cause of the stacking: `TEXTAREA_BASE` in `src/components/mentions/MentionTextarea.tsx` starts with `flex`, applied to the overlay `div`; segment `<span>`s become flex items. Replace with block-level flow on the overlay only (the real `Textarea` keeps its own classes).
- Mention span classes: `inline-flex flex-row items-center whitespace-nowrap align-baseline leading-[inherit] text-[length:inherit] bg-primary/10 font-semibold text-primary`.
- Add `src/components/EmojiPicker.tsx` (static emoji groups, no new dependency) exposing a `trigger` prop and `onSelect(emoji)`, matching the `GifPicker` API.
- Expose an imperative `insertAtCaret` on `MentionTextarea` via `useImperativeHandle` (or a small caret-aware helper the consumers call), so insertion maps the display caret back to the raw value containing `@[Name](uuid)` markers using the existing `mapDisplayIndexToRaw` helpers.
- Consumers to update: `CommentInput.tsx`, `CreatePostModal.tsx`. No schema or backend changes.
