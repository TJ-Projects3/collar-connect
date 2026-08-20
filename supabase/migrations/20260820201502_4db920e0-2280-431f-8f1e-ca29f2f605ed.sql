ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS secondary_reference_id uuid;

ALTER TABLE public.notifications REPLICA IDENTITY FULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'notifications'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications';
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.notify_on_post_reply()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_author uuid;
  v_sender_name text;
BEGIN
  SELECT author_id INTO v_author FROM public.posts WHERE id = NEW.post_id;
  IF v_author IS NULL OR v_author = NEW.author_id THEN
    RETURN NEW;
  END IF;

  SELECT COALESCE(full_name, 'Someone') INTO v_sender_name
  FROM public.profiles WHERE id = NEW.author_id;

  INSERT INTO public.notifications (user_id, sender_id, type, title, body, reference_id, secondary_reference_id)
  VALUES (
    v_author,
    NEW.author_id,
    'post_reply',
    'New reply on your post',
    COALESCE(v_sender_name, 'Someone') || ' replied: ' || left(NEW.content, 140),
    NEW.post_id,
    NEW.id
  );
  RETURN NEW;
END;
$$;