# Robust Resume URL Resolution

## Verified current state
- `resumes` bucket exists and is public.
- `storage.objects` has a SELECT policy `Public Access to Resumes` scoped to `bucket_id = 'resumes'` for `public` (anon + authenticated), plus per-user INSERT/DELETE policies keyed to the user's folder. Read access is already correct — no migration needed.
- The single existing `profiles.resume_url` value is a full public HTTPS URL, and the corresponding object exists in storage (`application/pdf`, ~88 KB).
- Resume links render in exactly one place: the "View Resume" button in `src/components/DeveloperPortfolioCard.tsx`, plus the "View file" style link inside `src/components/DeveloperPortfolioModal.tsx`. Both use `profile.resume_url` verbatim, so any value stored as a bare storage path (`<uid>/resume-123.pdf`) or a partial `/storage/v1/...` path would 404.

## What to build

### 1. Shared resolver helper
Add `resolveStorageUrl` (in `src/lib/portfolio-validation.ts`, which already holds resume helpers) that takes a stored value and a bucket name and returns a usable HTTPS URL:
- If the value already starts with `http://`/`https://`, return it unchanged.
- If it contains `/storage/v1/object/public/<bucket>/`, extract the object path and re-derive the URL via `supabase.storage.from(bucket).getPublicUrl(path)` so the URL always matches the current project host.
- Otherwise treat the value as an object path (stripping a leading `/` and a leading `<bucket>/` prefix if present) and return `getPublicUrl(path)`.
- Also export a `resolveResumeUrl(value)` convenience wrapper bound to the `resumes` bucket.

### 2. Use it at both view points
- `DeveloperPortfolioCard.tsx`: resolve the URL for the "View Resume" anchor, keeping `target="_blank" rel="noopener noreferrer"` so the PDF opens cleanly in a new tab.
- `DeveloperPortfolioModal.tsx`: resolve the URL for the existing uploaded-file view link, and derive the displayed filename from the object path rather than the whole URL.
- Guard against an unresolvable/empty value by not rendering the button, so no dead link is shown.

### 3. Filename display
Keep showing a readable filename (last path segment, URL-decoded) while linking to the resolved URL.

## Technical notes
Files touched: `src/lib/portfolio-validation.ts`, `src/components/DeveloperPortfolioCard.tsx`, `src/components/DeveloperPortfolioModal.tsx`. No database migration and no storage-policy change — read access is already verified working. Upload logic stays as-is (it stores a full public URL); the resolver just makes viewing tolerant of both formats, including any rows written by earlier or future code paths that save a bare path.

Verification: typecheck, then confirm the resolved URL for the existing resume object returns a 200 PDF response.
