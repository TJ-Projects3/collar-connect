-- 1. Storage: content-images ownership checks
DROP POLICY IF EXISTS "Authenticated users can update content images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete content images" ON storage.objects;

CREATE POLICY "Owners can update their content images"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'content-images' AND (owner = auth.uid() OR public.has_role(auth.uid(), 'admin')))
WITH CHECK (bucket_id = 'content-images' AND (owner = auth.uid() OR public.has_role(auth.uid(), 'admin')));

CREATE POLICY "Owners can delete their content images"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'content-images' AND (owner = auth.uid() OR public.has_role(auth.uid(), 'admin')));

DROP POLICY IF EXISTS "Authenticated users can upload content images" ON storage.objects;
CREATE POLICY "Authenticated users can upload content images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'content-images');

-- 2. Storage: resumes readable only by owner, admins, approved recruiters/industry
DROP POLICY IF EXISTS "Public Access to Resumes" ON storage.objects;

CREATE POLICY "Resume owners admins and approved recruiters can read resumes"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'resumes'
  AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR public.has_role(auth.uid(), 'admin')
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.profile_type IN ('recruiter', 'industry')
        AND NOT public.recruiter_blocked(auth.uid())
    )
  )
);

-- 3. email_logs: remove permissive write policies (service role bypasses RLS)
DROP POLICY IF EXISTS "System can insert email logs" ON public.email_logs;
DROP POLICY IF EXISTS "System can update email logs" ON public.email_logs;

-- 4. Remove email-harvesting function
DROP FUNCTION IF EXISTS public.get_user_email(uuid);

-- 5. jobs: require auth to read, constrain contact_url scheme
DROP POLICY IF EXISTS "Anyone can view published jobs" ON public.jobs;
CREATE POLICY "Signed-in users can view published jobs"
ON public.jobs FOR SELECT TO authenticated
USING (is_published = true);

UPDATE public.jobs SET contact_url = NULL
WHERE contact_url IS NOT NULL AND contact_url !~ '^https?://';

ALTER TABLE public.jobs
  ADD CONSTRAINT jobs_contact_url_scheme_check
  CHECK (contact_url IS NULL OR contact_url ~ '^https?://');

-- 6. messages: prevent content tampering
DROP POLICY IF EXISTS "Users can update their messages" ON public.messages;
DROP POLICY IF EXISTS "Users can update their received messages" ON public.messages;
CREATE POLICY "Recipients can update read state"
ON public.messages FOR UPDATE TO authenticated
USING (recipient_id = auth.uid())
WITH CHECK (recipient_id = auth.uid());

CREATE OR REPLACE FUNCTION public.messages_immutable_content()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.content := OLD.content;
  NEW.sender_id := OLD.sender_id;
  NEW.recipient_id := OLD.recipient_id;
  NEW.conversation_id := OLD.conversation_id;
  NEW.created_at := OLD.created_at;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS messages_immutable_content_trg ON public.messages;
CREATE TRIGGER messages_immutable_content_trg
BEFORE UPDATE ON public.messages
FOR EACH ROW EXECUTE FUNCTION public.messages_immutable_content();

-- 7. send_dm input validation
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
  IF auth.uid() IS NULL OR auth.uid() != sender THEN
    RAISE EXCEPTION 'Access denied: cannot send messages as another user';
  END IF;

  IF recipient IS NULL OR recipient = sender THEN
    RAISE EXCEPTION 'Invalid recipient';
  END IF;

  IF message_text IS NULL OR length(btrim(message_text)) = 0 THEN
    RAISE EXCEPTION 'Message content cannot be empty';
  END IF;

  IF length(message_text) > 10000 THEN
    RAISE EXCEPTION 'Message content exceeds maximum length of 10000 characters';
  END IF;

  IF public.recruiter_blocked(sender) THEN
    RAISE EXCEPTION 'Your recruiter account is pending approval and cannot send messages yet';
  END IF;

  IF public.is_blocked(sender, recipient) THEN
    RAISE EXCEPTION 'You cannot message this user';
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
  VALUES (sender, recipient, btrim(message_text), v_conversation_id)
  RETURNING *;

  UPDATE conversations c
  SET last_message = btrim(message_text), last_message_at = now()
  WHERE c.id = v_conversation_id;
END;
$function$;

-- 8. profiles: drop unused sensitive gpa column
ALTER TABLE public.profiles DROP COLUMN IF EXISTS gpa;

-- 9. question_summaries: restrict who can refresh a summary
DROP POLICY IF EXISTS "Authenticated users can refresh thread summaries" ON public.question_summaries;
CREATE POLICY "Question authors and admins can refresh thread summaries"
ON public.question_summaries FOR UPDATE TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
  OR EXISTS (
    SELECT 1 FROM public.questions q
    WHERE q.id = question_summaries.question_id AND q.author_id = auth.uid()
  )
)
WITH CHECK (
  public.has_role(auth.uid(), 'admin')
  OR EXISTS (
    SELECT 1 FROM public.questions q
    WHERE q.id = question_summaries.question_id AND q.author_id = auth.uid()
  )
);

-- 10. Pin search_path on remaining functions
ALTER FUNCTION public.call_email_notification() SET search_path = public;
ALTER FUNCTION public.create_email_preferences_for_new_user() SET search_path = public;
ALTER FUNCTION public.create_notification_for_connection_request() SET search_path = public;
ALTER FUNCTION public.notify_on_message() SET search_path = public;
ALTER FUNCTION public.notify_on_new_message() SET search_path = public;
ALTER FUNCTION public.update_conversation_last_message() SET search_path = public;
ALTER FUNCTION public.update_notification_for_connection_status() SET search_path = public;

-- 11. Remove anon data/API access (no public page reads the database)
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM anon;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO service_role;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_blocked(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.recruiter_blocked(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.send_dm(uuid, uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_trending_hashtags(integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.record_talent_access(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.talent_access_quota() TO authenticated;