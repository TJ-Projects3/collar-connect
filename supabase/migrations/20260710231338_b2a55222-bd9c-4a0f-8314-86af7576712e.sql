
-- 1. Preferences columns
ALTER TABLE public.email_preferences
  ADD COLUMN IF NOT EXISTS email_on_post_like boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS email_on_post_reply boolean NOT NULL DEFAULT true;

-- 2. Notify on post like
CREATE OR REPLACE FUNCTION public.notify_on_post_like()
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
  IF v_author IS NULL OR v_author = NEW.user_id THEN
    RETURN NEW;
  END IF;

  SELECT COALESCE(full_name, 'Someone') INTO v_sender_name
  FROM public.profiles WHERE id = NEW.user_id;

  INSERT INTO public.notifications (user_id, sender_id, type, title, body, reference_id)
  VALUES (
    v_author,
    NEW.user_id,
    'post_like',
    'New reaction on your post',
    COALESCE(v_sender_name, 'Someone') || ' reacted to your post',
    NEW.post_id
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS notify_on_post_like_trigger ON public.post_likes;
CREATE TRIGGER notify_on_post_like_trigger
AFTER INSERT ON public.post_likes
FOR EACH ROW EXECUTE FUNCTION public.notify_on_post_like();

-- 3. Notify on post reply
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

  INSERT INTO public.notifications (user_id, sender_id, type, title, body, reference_id)
  VALUES (
    v_author,
    NEW.author_id,
    'post_reply',
    'New reply on your post',
    COALESCE(v_sender_name, 'Someone') || ' replied: ' || left(NEW.content, 140),
    NEW.post_id
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS notify_on_post_reply_trigger ON public.post_replies;
CREATE TRIGGER notify_on_post_reply_trigger
AFTER INSERT ON public.post_replies
FOR EACH ROW EXECUTE FUNCTION public.notify_on_post_reply();
