UPDATE public.questions q
SET answer_count = sub.c
FROM (
  SELECT q2.id, (SELECT count(*) FROM public.question_answers a WHERE a.question_id = q2.id) AS c
  FROM public.questions q2
) AS sub
WHERE q.id = sub.id AND q.answer_count IS DISTINCT FROM sub.c;