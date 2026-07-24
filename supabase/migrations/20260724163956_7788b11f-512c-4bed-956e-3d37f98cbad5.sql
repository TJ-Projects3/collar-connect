
-- QUESTIONS
CREATE TABLE public.questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT NOT NULL DEFAULT '',
  tags TEXT[] NOT NULL DEFAULT '{}',
  upvotes INTEGER NOT NULL DEFAULT 0,
  answer_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.questions TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.questions TO authenticated;
GRANT ALL ON public.questions TO service_role;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Questions are viewable by everyone" ON public.questions FOR SELECT USING (true);
CREATE POLICY "Users can create own questions" ON public.questions FOR INSERT TO authenticated WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Users can update own questions" ON public.questions FOR UPDATE TO authenticated USING (auth.uid() = author_id) WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Users can delete own questions" ON public.questions FOR DELETE TO authenticated USING (auth.uid() = author_id);

-- ANSWERS
CREATE TABLE public.question_answers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  upvotes INTEGER NOT NULL DEFAULT 0,
  is_accepted BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.question_answers TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.question_answers TO authenticated;
GRANT ALL ON public.question_answers TO service_role;
ALTER TABLE public.question_answers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Answers are viewable by everyone" ON public.question_answers FOR SELECT USING (true);
CREATE POLICY "Users can create own answers" ON public.question_answers FOR INSERT TO authenticated WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Users can update own answers or question author can accept"
  ON public.question_answers FOR UPDATE TO authenticated
  USING (
    auth.uid() = author_id
    OR EXISTS (SELECT 1 FROM public.questions q WHERE q.id = question_id AND q.author_id = auth.uid())
  )
  WITH CHECK (
    auth.uid() = author_id
    OR EXISTS (SELECT 1 FROM public.questions q WHERE q.id = question_id AND q.author_id = auth.uid())
  );
CREATE POLICY "Users can delete own answers" ON public.question_answers FOR DELETE TO authenticated USING (auth.uid() = author_id);

-- VOTES (polymorphic: either question_id OR answer_id, not both)
CREATE TABLE public.question_votes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question_id UUID REFERENCES public.questions(id) ON DELETE CASCADE,
  answer_id UUID REFERENCES public.question_answers(id) ON DELETE CASCADE,
  value SMALLINT NOT NULL CHECK (value IN (-1, 1)),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK ((question_id IS NOT NULL) <> (answer_id IS NOT NULL))
);
CREATE UNIQUE INDEX question_votes_user_question_uniq ON public.question_votes(user_id, question_id) WHERE question_id IS NOT NULL;
CREATE UNIQUE INDEX question_votes_user_answer_uniq ON public.question_votes(user_id, answer_id) WHERE answer_id IS NOT NULL;
GRANT SELECT ON public.question_votes TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.question_votes TO authenticated;
GRANT ALL ON public.question_votes TO service_role;
ALTER TABLE public.question_votes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Votes viewable by everyone" ON public.question_votes FOR SELECT USING (true);
CREATE POLICY "Users manage own votes" ON public.question_votes FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- COUNTER TRIGGERS
CREATE OR REPLACE FUNCTION public.qa_apply_vote() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
DECLARE delta INT := 0;
BEGIN
  IF TG_OP = 'INSERT' THEN
    delta := NEW.value;
    IF NEW.question_id IS NOT NULL THEN UPDATE public.questions SET upvotes = upvotes + delta WHERE id = NEW.question_id;
    ELSE UPDATE public.question_answers SET upvotes = upvotes + delta WHERE id = NEW.answer_id; END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    delta := NEW.value - OLD.value;
    IF NEW.question_id IS NOT NULL THEN UPDATE public.questions SET upvotes = upvotes + delta WHERE id = NEW.question_id;
    ELSE UPDATE public.question_answers SET upvotes = upvotes + delta WHERE id = NEW.answer_id; END IF;
  ELSIF TG_OP = 'DELETE' THEN
    delta := -OLD.value;
    IF OLD.question_id IS NOT NULL THEN UPDATE public.questions SET upvotes = upvotes + delta WHERE id = OLD.question_id;
    ELSE UPDATE public.question_answers SET upvotes = upvotes + delta WHERE id = OLD.answer_id; END IF;
  END IF;
  RETURN COALESCE(NEW, OLD);
END; $$;
CREATE TRIGGER qa_apply_vote_trg AFTER INSERT OR UPDATE OR DELETE ON public.question_votes FOR EACH ROW EXECUTE FUNCTION public.qa_apply_vote();

CREATE OR REPLACE FUNCTION public.qa_answer_count() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN UPDATE public.questions SET answer_count = answer_count + 1 WHERE id = NEW.question_id;
  ELSIF TG_OP = 'DELETE' THEN UPDATE public.questions SET answer_count = GREATEST(answer_count - 1, 0) WHERE id = OLD.question_id; END IF;
  RETURN COALESCE(NEW, OLD);
END; $$;
CREATE TRIGGER qa_answer_count_trg AFTER INSERT OR DELETE ON public.question_answers FOR EACH ROW EXECUTE FUNCTION public.qa_answer_count();

CREATE TRIGGER questions_updated_at BEFORE UPDATE ON public.questions FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER question_answers_updated_at BEFORE UPDATE ON public.question_answers FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
