-- 1. Reports
CREATE TYPE public.report_target_type AS ENUM ('post','reply','question','answer');
CREATE TYPE public.report_reason AS ENUM ('spam','harassment','sexual','violence','misinformation','other');
CREATE TYPE public.report_status AS ENUM ('open','reviewed','dismissed');

CREATE TABLE public.content_reports (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reporter_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_type public.report_target_type NOT NULL,
  target_id uuid NOT NULL,
  target_author_id uuid,
  content_preview text,
  reason public.report_reason NOT NULL,
  details text,
  status public.report_status NOT NULL DEFAULT 'open',
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.content_reports TO authenticated;
GRANT ALL ON public.content_reports TO service_role;

ALTER TABLE public.content_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create their own reports"
ON public.content_reports FOR INSERT TO authenticated
WITH CHECK (reporter_id = auth.uid());

CREATE POLICY "Users can view their own reports"
ON public.content_reports FOR SELECT TO authenticated
USING (reporter_id = auth.uid() OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'moderator'));

CREATE POLICY "Moderators can update reports"
ON public.content_reports FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'moderator'))
WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'moderator'));

CREATE TRIGGER content_reports_updated_at
BEFORE UPDATE ON public.content_reports
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE INDEX content_reports_status_idx ON public.content_reports(status, created_at DESC);

-- 2. Blocked users
CREATE TABLE public.blocked_users (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  blocker_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  blocked_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (blocker_id, blocked_id),
  CONSTRAINT blocked_users_not_self CHECK (blocker_id <> blocked_id)
);

GRANT SELECT, INSERT, DELETE ON public.blocked_users TO authenticated;
GRANT ALL ON public.blocked_users TO service_role;

ALTER TABLE public.blocked_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own blocks"
ON public.blocked_users FOR ALL TO authenticated
USING (blocker_id = auth.uid())
WITH CHECK (blocker_id = auth.uid());

CREATE INDEX blocked_users_blocker_idx ON public.blocked_users(blocker_id);
CREATE INDEX blocked_users_blocked_idx ON public.blocked_users(blocked_id);

-- 3. Block-aware messaging
CREATE OR REPLACE FUNCTION public.is_blocked(_a uuid, _b uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.blocked_users
    WHERE (blocker_id = _a AND blocked_id = _b)
       OR (blocker_id = _b AND blocked_id = _a)
  )
$$;

DROP POLICY IF EXISTS "Users can send messages" ON public.messages;
CREATE POLICY "Users can send messages"
ON public.messages FOR INSERT TO authenticated
WITH CHECK (
  sender_id = auth.uid()
  AND NOT public.recruiter_blocked(auth.uid())
  AND NOT public.is_blocked(auth.uid(), recipient_id)
);

-- 4. Ownership links so account deletion cascades cleanly
ALTER TABLE public.post_replies DROP CONSTRAINT IF EXISTS post_replies_author_id_fkey;
ALTER TABLE public.post_replies
  ADD CONSTRAINT post_replies_author_id_fkey
  FOREIGN KEY (author_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.post_likes DROP CONSTRAINT IF EXISTS post_likes_user_id_fkey;
ALTER TABLE public.post_likes
  ADD CONSTRAINT post_likes_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.student_projects DROP CONSTRAINT IF EXISTS student_projects_user_id_fkey;
ALTER TABLE public.student_projects
  ADD CONSTRAINT student_projects_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.student_endorsements DROP CONSTRAINT IF EXISTS student_endorsements_student_id_fkey;
ALTER TABLE public.student_endorsements
  ADD CONSTRAINT student_endorsements_student_id_fkey
  FOREIGN KEY (student_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.jobs DROP CONSTRAINT IF EXISTS jobs_created_by_fkey;
ALTER TABLE public.jobs
  ADD CONSTRAINT jobs_created_by_fkey
  FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE SET NULL;