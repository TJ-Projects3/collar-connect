# Fix Trending Topics Widget on Feed Sidebar

## Goal
Clean up the right-sidebar "Trending" card so it always presents an inviting, actionable set of topic pills, and make those pills filter the main feed by hashtag.

## Changes

### 1. Heading cleanup
- Rename the card title from **"Trending"** to **"Explore Topics"**.
- Keep the `TrendingUp` icon for visual continuity.

### 2. Fallback / empty state copy
- Remove the subtext: *"No trending topics yet. Try one of these to start a conversation:"*.
- When dynamic trending hashtags are empty, show the same set of suggested pills without the apologetic explanation, so the widget always feels intentional.

### 3. Hashtag pill behavior
- Change the four suggested pills (`#DiversityInTech`, `#Cybersecurity`, `#Internships`, `#CareerMapping`) so clicking one sets the feed's active hashtag filter (`activeHashtag`) instead of opening the create-post modal.
- Tapping an already-active pill clears the filter (toggle behavior), matching the dynamic trending rows.

### 4. Styling
- Keep the existing rounded-full pill style, primary/10 background, and `hover:bg-primary/20` transition.
- Add a subtle active state ring/highlight when a pill's tag matches `activeHashtag`.

## Files to edit
- `src/pages/Feed.tsx` — update the right sidebar "Trending Hashtags" card (lines ~624-675).

## Out of scope
- No database or hook changes; `useTrendingHashtags` and `activeHashtag` filtering logic already exist.
- No changes to the dynamic trending rows when data is present.
