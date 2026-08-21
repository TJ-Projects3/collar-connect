-- 1) Deduplicate existing votes (keep newest per user/target)
DELETE FROM public.question_votes v
USING public.question_votes v2
WHERE v.question_id IS NOT NULL
  AND v.question_id = v2.question_id
  AND v.user_id = v2.user_id
  AND (v.created_at, v.id) < (v2.created_at, v2.id);

DELETE FROM public.question_votes v
USING public.question_votes v2
WHERE v.answer_id IS NOT NULL
  AND v.answer_id = v2.answer_id
  AND v.user_id = v2.user_id
  AND (v.created_at, v.id) < (v2.created_at, v2.id);

-- 2) Uniqueness per user per target
CREATE UNIQUE INDEX IF NOT EXISTS question_votes_user_question_unique
  ON public.question_votes (user_id, question_id)
  WHERE question_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS question_votes_user_answer_unique
  ON public.question_votes (user_id, answer_id)
  WHERE answer_id IS NOT NULL;

-- 3) Recompute-from-source trigger (drift-proof)
CREATE OR REPLACE FUNCTION public.qa_apply_vote()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
DECLARE
  v_question_id uuid := COALESCE(NEW.question_id, OLD.question_id);
  v_answer_id uuid := COALESCE(NEW.answer_id, OLD.answer_id);
BEGIN
  IF v_question_id IS NOT NULL THEN
    UPDATE public.questions q
    SET upvotes = (
      SELECT COALESCE(SUM(value), 0)
      FROM public.question_votes
      WHERE question_id = v_question_id
    )
    WHERE q.id = v_question_id;
  END IF;

  IF v_answer_id IS NOT NULL THEN
    UPDATE public.question_answers a
    SET upvotes = (
      SELECT COALESCE(SUM(value), 0)
      FROM public.question_votes
      WHERE answer_id = v_answer_id
    )
    WHERE a.id = v_answer_id;
  END IF;

  RETURN COALESCE(NEW, OLD);
END; $$;

-- 4) Backfill correct totals
UPDATE public.questions q
SET upvotes = (
  SELECT COALESCE(SUM(value), 0) FROM public.question_votes WHERE question_id = q.id
);

UPDATE public.question_answers a
SET upvotes = (
  SELECT COALESCE(SUM(value), 0) FROM public.question_votes WHERE answer_id = a.id
);