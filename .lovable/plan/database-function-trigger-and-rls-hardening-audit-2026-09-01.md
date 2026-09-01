# Database function, trigger, and RLS hardening audit

## What the audit found (verified against the live database)

Good news first — most of what you asked to check is already in place:

- **Search paths:** all 36 functions in the `public` schema already pin `search_path = public`. None of them are hijackable through an unqualified schema, but none include `pg_temp` either, which is the recommended final element.
- **RLS:** enabled on all 31 public tables, including `jobs`, `profiles`, `question_answers`, `conversations`, `messages`, and `notifications`. Every table has at least one policy. There is no `recruiter_profiles` table — recruiter data lives on `profiles` (`recruiter_status`, `is_verified_recruiter`, `company_email`).
- **Privilege checks:** `record_talent_access`, `talent_access_quota`, and `send_dm` all verify `auth.uid()` inside the body. Every verification-guard trigger (`protect_verified_recruiter`, `protect_company_verification`, `protect_industry_verified`, `protect_project_verification`, `block_insert_verified_project`) re-checks `has_role(auth.uid(),'admin')` and silently reverts unauthorized changes. Only 7 non-trigger functions are executable by `authenticated`; none are executable by `anon`.

Real issues found, in priority order:

1. **A service-role JWT is hard-coded in `call_email_notification()`** (the trigger that fires the notification-email function). A long-lived key that bypasses all RLS is stored in database source instead of a secret store. This is the most serious finding.
2. **Policies granted to the `public` role instead of `authenticated`** — `messages` (read), `notifications` (3 policies), `conversations` (one duplicate), `jobs` (the admin "manage all" policy). They are not currently exploitable because each condition compares to `auth.uid()`, which is null for anonymous callers, but they widen the surface unnecessarily and are easy to misread.
3. **Duplicate overlapping policies** on `messages`, `notifications`, and `conversations` (two SELECT policies each expressing the same rule differently). Overlapping permissive policies OR together, so the loosest one wins — dead weight that makes future review error-prone.
4. **`UPDATE` policies missing explicit `WITH CHECK`** on `profiles` and the `jobs` admin policy. Postgres falls back to `USING` here, so behavior is currently correct, but stating it explicitly prevents a future edit from silently opening a hole.
5. **`normalize_job_classification` is not `SECURITY DEFINER`** and does not need to be — it only rewrites `NEW` columns. No change needed beyond the search-path tightening.

## What I will change

**One migration:**

- Re-declare all 36 public functions' config as `SET search_path = public, pg_temp` (via `ALTER FUNCTION`, no body rewrites — so behavior is untouched).
- Replace `call_email_notification()` so the service-role key is read from database configuration rather than embedded in the function body, and store that key using the secret/settings mechanism instead of source code.
- Rewrite the `public`-role policies on `messages`, `notifications`, `conversations`, and `jobs` to target `authenticated` (and `anon` only where truly public, which is none of these).
- Drop the redundant duplicate SELECT policies on `messages`, `notifications`, and `conversations`, keeping the single clearest version of each rule.
- Add explicit `WITH CHECK` to the `profiles` update policy and the `jobs` admin policy.

**No application code changes are needed** — none of the above alters any query the app makes. After the migration I will re-run the Supabase linter and re-verify the policy set with a direct query.

## Technical notes

- `ALTER FUNCTION ... SET search_path = public, pg_temp` is applied to each function individually; `pg_temp` last prevents temp-schema shadowing during definer execution.
- `call_email_notification()` becomes: read the key via `current_setting('app.settings.service_role_key', true)`, and skip the `net.http_post` (returning `NEW`) when it is missing, so notification inserts never fail if the setting is absent.
- `has_role`, `is_blocked`, and `recruiter_blocked` take arbitrary uuid arguments and are callable by `authenticated`. They return only booleans and are used inside policies, so their signatures stay as-is; noted for the record.
- The `profiles` select policy still exposes `company_email` / `company_website` to any signed-in user. That is an existing product decision, not a regression, so it is out of scope here — say the word and I will scope column-level restriction separately.
