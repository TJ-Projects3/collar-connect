
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS is_anonymous boolean NOT NULL DEFAULT false;
ALTER TABLE public.question_answers ADD COLUMN IF NOT EXISTS is_anonymous boolean NOT NULL DEFAULT false;

CREATE OR REPLACE FUNCTION public.check_anonymous_answer()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.is_anonymous THEN
    IF EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = NEW.author_id
        AND (profile_type = 'recruiter' OR is_verified_recruiter = true)
    ) THEN
      RAISE EXCEPTION 'Recruiters cannot post anonymous answers';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_check_anonymous_answer ON public.question_answers;
CREATE TRIGGER trg_check_anonymous_answer
BEFORE INSERT OR UPDATE ON public.question_answers
FOR EACH ROW EXECUTE FUNCTION public.check_anonymous_answer();
