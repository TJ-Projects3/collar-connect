## Goal

Make the recruiter badge on the profile header read as an official, high-authority identity pill — clearly distinct from the muted metadata pills (location, LinkedIn) around it — and show the recruiter's company inside it when available.

## What changes

**1. `src/components/RecruiterBadge.tsx` — upgraded pill**

- Add an optional `company` prop and a `size` variant (`sm` for inline feed/comment usage, `lg` for the profile header) so the existing five call sites keep their current small look and only the profile header gets the prominent treatment.
- Verified state: solid primary background with `text-primary-foreground`, a `BadgeCheck` icon on the left, slightly larger type, tighter tracking, and an elegant elevated shadow using the existing `--shadow-elegant`/primary-tinted shadow token rather than a hardcoded color.
- When `company` is present, render it inside the same pill after a thin separator dot: `✓ Verified Recruiter · NextGen Collar`, with the company text at slightly reduced opacity so "Verified Recruiter" stays the dominant read. The company truncates rather than wrapping so the pill never breaks its rounded shape.
- Unverified recruiters keep a restrained bordered/muted treatment (with `Briefcase` icon) so verification remains visually meaningful.
- Everything uses semantic tokens (`bg-primary`, `text-primary-foreground`, `border-border`) — no hardcoded colors, works in light and dark mode.

**2. `src/pages/Profile.tsx` — header integration**

- Pass `size="lg"` and `company={profile?.company_name}` to the badge in the header badge row (line 332).
- Keep the badge row directly under the name, aligned left with the name and endorsement pills, wrapping cleanly on narrow screens; verify spacing so the pill has consistent rhythm above the subline text.
- Since the company will now appear in the badge, keep the subline as-is (it shows title + company for recruiters) unless it duplicates verbatim — in that case trim the company from the subline so the same string isn't printed twice.

## Notes

- No database or business-logic changes; presentation only.
- Other usages (Feed, Community, ReplyModal, InlineReplies) are unaffected because they use the default/compact size and pass no company.
