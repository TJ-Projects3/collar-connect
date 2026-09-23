# Mention styling cleanup + "connections only" mention privacy

## 1. Visual styling

The highlighted name in post, comment, reply, and message boxes becomes simply **bold text with a soft blue background**. All structural styling on the highlight is removed — no padding, margins, borders, rounded corners, inline-block, nowrap, or line-height tweaks — so it sits flush and flows exactly like normal typed text.

## 2. New privacy setting

Add a per-user setting, off by default: **"Only allow my connections to @mention me"**.

It appears as a toggle in the Privacy section of Settings & Privacy, saved to the user's profile immediately with a confirmation toast, alongside the existing privacy toggles.

## 3. Who can tag whom

- With the setting on, that person no longer appears in the @ suggestion list for anyone who is not an accepted connection. Their connections still see them normally.
- If someone who is not a connection tags them anyway (for example by pasting text), the tag still displays as a name but **no mention alert is created** — it is dropped silently, with no error shown to either person.
- Everyone else is unaffected; existing content and notifications stay as they are.

## Technical approach

### Database (one migration)

- `ALTER TABLE public.profiles ADD COLUMN mentions_connections_only boolean NOT NULL DEFAULT false;`
- Replace `public.notify_mentions(...)` (same signature, `SECURITY DEFINER`, `SET search_path = public, pg_temp`). After the existing self-tag, missing-profile, and block checks, add:

```sql
IF (SELECT mentions_connections_only FROM public.profiles WHERE id = _target)
   AND NOT EXISTS (
     SELECT 1 FROM public.user_connections
     WHERE status = 'accepted'
       AND ((requester_id = _author AND receiver_id = _target)
         OR (requester_id = _target AND receiver_id = _author))
   )
THEN CONTINUE; END IF;
```

The existing `notify_mentions_post`, `notify_mentions_reply`, and `notify_mentions_message` triggers call this function, so all three surfaces are covered with no trigger changes. No RLS or grant changes are needed: the column rides on `profiles`, which users already update for themselves.

### Frontend

- `src/components/mentions/MentionTextarea.tsx` — mention span class reduces to `bg-primary/10 font-semibold text-primary`; the overlay drops the `leading-normal` / `word-break` / `overflow-wrap` overrides added for the previous pill treatment, and the textarea drops its matching overrides so both layers fall back to the shared shadcn metrics.
- `src/hooks/useMentionSearch.ts` — select `mentions_connections_only` alongside the existing fields and filter out rows where it is true and the id is not in the caller's accepted-connection set, before the connections-first sort and 8-row slice. The limit is raised from 20 to 30 so filtering does not thin the list.
- `src/pages/Settings.tsx` — add a `Switch` row in the Privacy card bound to `profile.mentions_connections_only`, saved through the existing `useUpdateProfile` mutation with the same pending-disabled and toast pattern as the "Visible to industry professionals" toggle.

### Verification

- TypeScript check.
- Direct database checks that a restricted user receives no mention notification from a non-connection and does receive one from an accepted connection, using temporary rows that are removed afterwards.
