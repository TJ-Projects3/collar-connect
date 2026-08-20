-- 1. Recruiter status enum
DO $$ BEGIN
  CREATE TYPE public.recruiter_status AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 2. New profile columns
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS recruiter_status public.recruiter_status NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS years_of_experience integer,
  ADD COLUMN IF NOT EXISTS current_company text,
  ADD COLUMN IF NOT EXISTS "current_role" text,
  ADD COLUMN IF NOT EXISTS mentorship_opt_in boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS areas_of_expertise text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS company_email text,
  ADD COLUMN IF NOT EXISTS hiring_roles text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS company_website text;

-- 3. Backfill
UPDATE public.profiles
SET recruiter_status = 'approved'
WHERE is_verified_recruiter = true AND recruiter_status <> 'approved';

UPDATE public.profiles
SET current_company = COALESCE(current_company, industry_company),
    "current_role" = COALESCE("current_role", industry_role_title)
WHERE profile_type = 'industry';

-- 4. Only admins may change recruiter_status / verification flags; keep boolean in sync
CREATE OR REPLACE FUNCTION public.protect_verified_recruiter()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    IF NEW.is_verified_recruiter IS DISTINCT FROM OLD.is_verified_recruiter THEN
      NEW.is_verified_recruiter := OLD.is_verified_recruiter;
    END IF;
    IF NEW.recruiter_status IS DISTINCT FROM OLD.recruiter_status THEN
      NEW.recruiter_status := OLD.recruiter_status;
    END IF;
  END IF;

  -- Keep the legacy boolean aligned with the status
  IF NEW.recruiter_status IS DISTINCT FROM OLD.recruiter_status THEN
    NEW.is_verified_recruiter := (NEW.recruiter_status = 'approved');
  END IF;

  RETURN NEW;
END;
$function$;

-- 5. Blocked-recruiter helper
CREATE OR REPLACE FUNCTION public.recruiter_blocked(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = _user_id
      AND p.profile_type = 'recruiter'
      AND p.recruiter_status <> 'approved'
  ) AND NOT public.has_role(_user_id, 'admin');
$function$;

-- 6. Profiles: hide student rows from unapproved recruiters
DROP POLICY IF EXISTS "Authenticated users can view profiles" ON public.profiles;
CREATE POLICY "Authenticated users can view profiles"
ON public.profiles FOR SELECT TO authenticated
USING (
  id = auth.uid()
  OR profile_type <> 'student'
  OR NOT public.recruiter_blocked(auth.uid())
);

-- 7. Student projects: same gate
DROP POLICY IF EXISTS "Authenticated users can view projects" ON public.student_projects;
CREATE POLICY "Authenticated users can view projects"
ON public.student_projects FOR SELECT TO authenticated
USING (
  user_id = auth.uid()
  OR NOT public.recruiter_blocked(auth.uid())
);

-- 8. Messages: unapproved recruiters cannot send
DROP POLICY IF EXISTS "Users can access their messages" ON public.messages;
CREATE POLICY "Users can delete their messages"
ON public.messages FOR DELETE TO authenticated
USING (sender_id = auth.uid() OR recipient_id = auth.uid());

DROP POLICY IF EXISTS "Users can send messages" ON public.messages;
CREATE POLICY "Users can send messages"
ON public.messages FOR INSERT TO authenticated
WITH CHECK (sender_id = auth.uid() AND NOT public.recruiter_blocked(auth.uid()));

-- 9. Posts: unapproved recruiters cannot post
DROP POLICY IF EXISTS "Users can create own posts" ON public.posts;
CREATE POLICY "Users can create own posts"
ON public.posts FOR INSERT TO authenticated
WITH CHECK (auth.uid() = author_id AND NOT public.recruiter_blocked(auth.uid()));

-- 10. send_dm enforces the same rule
CREATE OR REPLACE FUNCTION public.send_dm(sender uuid, recipient uuid, message_text text)
RETURNS SETOF messages
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_conversation_id uuid;
  v_key text;
  v_user1 uuid;
  v_user2 uuid;
BEGIN
  IF auth.uid() != sender THEN
    RAISE EXCEPTION 'Access denied: cannot send messages as another user';
  END IF;

  IF public.recruiter_blocked(sender) THEN
    RAISE EXCEPTION 'Your recruiter account is pending approval and cannot send messages yet';
  END IF;

  IF sender < recipient THEN
    v_user1 := sender;
    v_user2 := recipient;
  ELSE
    v_user1 := recipient;
    v_user2 := sender;
  END IF;

  v_key := v_user1::text || '_' || v_user2::text;

  INSERT INTO conversations (conversation_key)
  VALUES (v_key)
  ON CONFLICT (conversation_key)
  DO UPDATE SET conversation_key = EXCLUDED.conversation_key
  RETURNING id INTO v_conversation_id;

  INSERT INTO conversation_participants (conversation_id, user_id)
  VALUES (v_conversation_id, v_user1), (v_conversation_id, v_user2)
  ON CONFLICT DO NOTHING;

  RETURN QUERY
  INSERT INTO messages (sender_id, recipient_id, content, conversation_id)
  VALUES (sender, recipient, message_text, v_conversation_id)
  RETURNING *;

  UPDATE conversations c
  SET last_message = message_text, last_message_at = now()
  WHERE c.id = v_conversation_id;
END;
$function$;