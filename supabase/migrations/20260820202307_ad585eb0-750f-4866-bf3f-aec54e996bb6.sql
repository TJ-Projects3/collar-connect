CREATE TABLE public.question_summaries (
  question_id uuid PRIMARY KEY REFERENCES public.questions(id) ON DELETE CASCADE,
  bullets jsonb NOT NULL DEFAULT '[]'::jsonb,
  takeaway text,
  answer_count integer NOT NULL DEFAULT 0,
  generated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.question_summaries TO anon;
GRANT SELECT, INSERT, UPDATE ON public.question_summaries TO authenticated;
GRANT ALL ON public.question_summaries TO service_role;

ALTER TABLE public.question_summaries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read thread summaries"
ON public.question_summaries FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can create thread summaries"
ON public.question_summaries FOR INSERT TO authenticated
WITH CHECK (auth.uid() IS NOT NULL AND generated_by = auth.uid());

CREATE POLICY "Authenticated users can refresh thread summaries"
ON public.question_summaries FOR UPDATE TO authenticated
USING (auth.uid() IS NOT NULL)
WITH CHECK (generated_by = auth.uid());

CREATE TRIGGER question_summaries_updated_at
BEFORE UPDATE ON public.question_summaries
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();