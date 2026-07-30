CREATE TABLE public.student_endorsements (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id uuid NOT NULL,
  project_id uuid REFERENCES public.student_projects(id) ON DELETE SET NULL,
  badge_title text NOT NULL,
  description text,
  issued_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX student_endorsements_student_idx ON public.student_endorsements(student_id);
CREATE INDEX student_endorsements_project_idx ON public.student_endorsements(project_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.student_endorsements TO authenticated;
GRANT ALL ON public.student_endorsements TO service_role;

ALTER TABLE public.student_endorsements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view endorsements"
ON public.student_endorsements FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins and moderators can create endorsements"
ON public.student_endorsements FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'));

CREATE POLICY "Admins and moderators can update endorsements"
ON public.student_endorsements FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'))
WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'));

CREATE POLICY "Admins and moderators can delete endorsements"
ON public.student_endorsements FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'));

CREATE TRIGGER student_endorsements_updated_at
BEFORE UPDATE ON public.student_endorsements
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();