-- Fix search_path for increment_post_likes function
CREATE OR REPLACE FUNCTION public.increment_post_likes()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  UPDATE public.posts
  SET likes_count = COALESCE(likes_count, 0) + 1
  WHERE id = NEW.post_id;
  RETURN NEW;
END;
$$;

-- Fix search_path for decrement_post_likes_count function
CREATE OR REPLACE FUNCTION public.decrement_post_likes_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  UPDATE public.posts
  SET likes_count = GREATEST(likes_count - 1, 0)
  WHERE id = OLD.post_id;
  RETURN OLD;
END;
$$;