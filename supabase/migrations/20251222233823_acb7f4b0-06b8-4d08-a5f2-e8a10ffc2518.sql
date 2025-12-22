-- Fix search_path for new functions
CREATE OR REPLACE FUNCTION public.increment_post_replies()
RETURNS TRIGGER 
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  UPDATE public.posts
  SET reply_count = reply_count + 1
  WHERE id = NEW.post_id;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.decrement_post_replies()
RETURNS TRIGGER 
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  UPDATE public.posts
  SET reply_count = GREATEST(reply_count - 1, 0)
  WHERE id = OLD.post_id;
  RETURN OLD;
END;
$$;