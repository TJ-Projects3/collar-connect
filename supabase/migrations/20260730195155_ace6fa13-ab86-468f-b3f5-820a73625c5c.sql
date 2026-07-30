CREATE TABLE public.student_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  cover_image_url text,
  tech_stack text[] NOT NULL DEFAULT '{}',
  repo_url text,
  live_url text,
  achievement_label text,
  achievement_verified boolean NOT NULL DEFAULT false,
  verified_by uuid,
  verified_at timestamptz,
  shared_post_id uuid,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.student_projects TO authenticated;
GRANT ALL ON public.student_projects TO service_role;

ALTER TABLE public.student_projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view projects"
  ON public.student_projects FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can create their own projects"
  ON public.student_projects FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own projects"
  ON public.student_projects FOR UPDATE TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'));

CREATE POLICY "Users can delete their own projects"
  ON public.student_projects FOR DELETE TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE INDEX student_projects_user_id_idx ON public.student_projects(user_id);

CREATE TRIGGER student_projects_updated_at
  BEFORE UPDATE ON public.student_projects
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE OR REPLACE FUNCTION public.protect_project_verification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.achievement_verified IS DISTINCT FROM OLD.achievement_verified THEN
    IF NOT (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator')) THEN
      NEW.achievement_verified := OLD.achievement_verified;
      NEW.verified_by := OLD.verified_by;
      NEW.verified_at := OLD.verified_at;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER student_projects_protect_verification
  BEFORE UPDATE ON public.student_projects
  FOR EACH ROW EXECUTE FUNCTION public.protect_project_verification();

CREATE OR REPLACE FUNCTION public.block_insert_verified_project()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.achievement_verified AND NOT (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator')) THEN
    NEW.achievement_verified := false;
    NEW.verified_by := NULL;
    NEW.verified_at := NULL;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER student_projects_block_insert_verified
  BEFORE INSERT ON public.student_projects
  FOR EACH ROW EXECUTE FUNCTION public.block_insert_verified_project();

ALTER TABLE public.posts ADD COLUMN project_id uuid REFERENCES public.student_projects(id) ON DELETE SET NULL;
CREATE INDEX posts_project_id_idx ON public.posts(project_id) WHERE project_id IS NOT NULL;

ALTER TABLE public.student_projects
  ADD CONSTRAINT student_projects_shared_post_fk
  FOREIGN KEY (shared_post_id) REFERENCES public.posts(id) ON DELETE SET NULL;

INSERT INTO public.student_projects (user_id, title, description, tech_stack, repo_url, live_url, display_order)
SELECT
  p.id,
  COALESCE(NULLIF(proj->>'title', ''), 'Untitled project'),
  NULLIF(proj->>'description', ''),
  COALESCE(
    (SELECT array_agg(t::text) FROM jsonb_array_elements_text(
      CASE WHEN jsonb_typeof(proj->'tech_stack') = 'array' THEN proj->'tech_stack' ELSE '[]'::jsonb END
    ) AS t),
    '{}'::text[]
  ),
  NULLIF(proj->>'repo_url', ''),
  NULLIF(proj->>'live_url', ''),
  (ord - 1)::int
FROM public.profiles p,
     LATERAL jsonb_array_elements(
       CASE WHEN jsonb_typeof(p.featured_projects) = 'array' THEN p.featured_projects ELSE '[]'::jsonb END
     ) WITH ORDINALITY AS e(proj, ord);