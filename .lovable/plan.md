# Fix squished Q&A question title on mobile

## What's wrong

On the question detail page, the title sits in the same horizontal row as the status badge ("Resolved (2 answers)" / "Active Discussion (2 answers)"). That badge refuses to shrink, so on a phone it takes most of the row and squeezes the title into a narrow column — which is why it stacks one word (or letter) per line.

The question list cards have the same pattern in the card footer: the author name, role badge and time share a locked row with the status badge, so on narrow screens the author line gets crushed instead of wrapping.

## What will change

1. **Question detail header (mobile)**
   - Title gets the full width of the card on phones; the status badge moves to its own line below the title.
   - On tablet and desktop the badge stays on the right of the title as it looks today.
   - Title text wraps normally at word boundaries and can break only genuinely long unbroken strings (a pasted URL), never ordinary words.

2. **Question list cards**
   - Author line and status badge wrap onto separate lines when there isn't room, instead of compressing.
   - Card titles keep full available width next to the vote column.

3. **Vote column**
   - Stays a fixed, non-shrinking column, and the text area beside it is allowed to shrink properly so it can never crush the title.

4. **Related nuances in the same page checked and tidied**
   - Answer cards: the author line and the row of actions (Book 1-on-1, Accept, menu) wrap cleanly on narrow screens rather than overflowing.
   - Long tag pills and long single-word titles stay inside the card.

No copy changes, no data or backend changes — layout and spacing only.

## Technical notes

- `src/pages/Community.tsx`
  - Detail header row (`flex items-start justify-between gap-3`) becomes `flex-col sm:flex-row sm:items-start sm:justify-between`; the `h1` gets `min-w-0 flex-1 break-words`.
  - List card body already has `flex-1 min-w-0`; add `break-words` to the `h2` and `min-w-0` guards on the footer row so `flex-wrap` can take effect.
  - Footer rows use `flex-wrap` with the badge as a wrap-eligible item.
- `src/components/community/QuestionStatusBadge.tsx`: keep `shrink-0` (it should not compress) but add `max-w-full` + `whitespace-nowrap` so it wraps as a block instead of forcing sibling shrink.
- Verify at 393px, 768px and 1440px widths that no horizontal overflow appears.
