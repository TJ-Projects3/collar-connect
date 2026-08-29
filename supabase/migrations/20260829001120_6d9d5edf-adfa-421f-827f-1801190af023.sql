CREATE OR REPLACE FUNCTION public.normalize_job_classification()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  t text := lower(coalesce(NEW.title, ''));
  d text := lower(left(coalesce(NEW.description, ''), 4000));
  yrs int;
  m text[];
BEGIN
  ---------------------------------------------------------------- internship
  IF t ~ '(intern|internship|co-?op|fellow|fellowship|apprentice)'
     OR d ~ '(summer intern|internship program|co-?op program)' THEN
    NEW.is_internship := true;
    NEW.experience_level := 'Internship';

  ELSIF t ~ '(director|vice president|\yvp\y|\yhead of\y|chief|\ycto\y|\ycio\y|distinguished)' THEN
    NEW.is_internship := false;
    NEW.experience_level := 'Lead/Executive';

  ELSIF t ~ '(senior|\ysr\.?\y|staff|principal|\ylead\y|architect|manager|\yiv\y)' THEN
    NEW.is_internship := false;
    NEW.experience_level := 'Senior';

  ELSIF t ~ '(junior|\yjr\.?\y|entry[ -]?level|new ?grad|graduate|associate|trainee)' THEN
    NEW.is_internship := false;
    NEW.experience_level := 'Entry Level';

  ELSIF t ~ '(\ymid\y|\yii\y|\yiii\y)' THEN
    NEW.is_internship := false;
    NEW.experience_level := 'Mid Level';

  ELSE
    NEW.is_internship := false;
    m := regexp_match(d, '([0-9]{1,2})\s*\+?\s*(?:-|to)?\s*[0-9]{0,2}\s*year');
    IF m IS NOT NULL THEN
      yrs := (m[1])::int;
      IF yrs >= 8 THEN NEW.experience_level := 'Lead/Executive';
      ELSIF yrs > 3 THEN NEW.experience_level := 'Senior';
      ELSIF yrs >= 2 THEN NEW.experience_level := 'Mid Level';
      ELSE NEW.experience_level := 'Entry Level';
      END IF;
    ELSE
      NEW.experience_level := 'Mid Level';
    END IF;
  END IF;

  IF NEW.experience_level = 'Entry Level'
     AND t ~ '(senior|\ysr\.?\y|staff|principal|\ylead\y|director|architect|\yvp\y|manager)' THEN
    NEW.experience_level := 'Senior';
  END IF;

  ---------------------------------------------------------------- track (specific first, title before description)
  NEW.track := CASE
    -- Product & Program
    WHEN t ~ '(product manager|product owner|\yapm\y|associate product|technical product|\ytpm\y|program manager|project manager|scrum master|product management)' THEN 'Product & Program'
    -- Design & UX
    WHEN t ~ '(ui ?/ ?ux|\yux\y|\yui\y designer|user experience|user interface|product designer|interaction designer|visual designer|ux research|graphic designer|design intern)' THEN 'Design & UX'
    -- Solutions & Sales Tech
    WHEN t ~ '(solutions? engineer|sales engineer|solutions? architect|technical account manager|implementation consultant|customer engineer|presales|pre-sales|solutions? consultant)' THEN 'Solutions & Sales Tech'
    -- Cybersecurity
    WHEN t ~ '(cyber|infosec|information security|\ysoc\y|penetration test|pentest|threat|vulnerab|appsec|security)' THEN 'Cybersecurity'
    -- Data & Analytics
    WHEN t ~ '(data analyst|business intelligence|\ybi\y analyst|analytics engineer|data strateg|tableau|power ?bi|machine learning|\yml\y engineer|artificial intelligence|\yai\y engineer|data scien|data engineer|analytics|\ynlp\y|\yllm\y|big data|reporting analyst|quantitative analyst)' THEN 'Data & Analytics'
    -- Cloud & DevOps
    WHEN t ~ '(devops|\ysre\y|site reliability|kubernetes|terraform|cloud|platform engineer|infrastructure engineer)' THEN 'Cloud & DevOps'
    -- IT & Operations
    WHEN t ~ '(help ?desk|service desk|system(s)? admin|sysadmin|network admin|network engineer|desktop support|\yit\y support|\yit\y specialist|\yit\y technician|technical support|support specialist|product ops|bizops|revops|business operations|operations analyst|systems engineer)' THEN 'IT & Operations'
    -- Software Engineering
    WHEN t ~ '(software|developer|engineer|programmer|full[ -]?stack|front[ -]?end|back[ -]?end|\yios\y|android|mobile|firmware|embedded|\ysdet\y|qa engineer|test engineer|react|\yjava\y|python|golang|\y\.net\y|node)' THEN 'Software Engineering'
    -- Description fallbacks
    WHEN d ~ '(product manager|program manager|product owner|scrum master)' THEN 'Product & Program'
    WHEN d ~ '(ux designer|product designer|user experience design|ui ?/ ?ux)' THEN 'Design & UX'
    WHEN d ~ '(solutions engineer|sales engineer|technical account manager|implementation consultant)' THEN 'Solutions & Sales Tech'
    WHEN d ~ '(cyber|infosec|penetration test|appsec)' THEN 'Cybersecurity'
    WHEN d ~ '(data analyst|business intelligence|machine learning|data scien|data engineer|analytics|tableau|power ?bi)' THEN 'Data & Analytics'
    WHEN d ~ '(devops|kubernetes|site reliability|cloud engineer|platform engineer)' THEN 'Cloud & DevOps'
    WHEN d ~ '(help ?desk|systems administrator|desktop support|technical support|network administrator)' THEN 'IT & Operations'
    WHEN d ~ '(software|developer|engineer|programmer)' THEN 'Software Engineering'
    ELSE 'Other'
  END;

  ---------------------------------------------------------------- keep enum in sync
  NEW.career_level := (CASE NEW.experience_level
    WHEN 'Internship' THEN 'internship'
    WHEN 'Entry Level' THEN 'entry_level'
    WHEN 'Mid Level' THEN 'associate'
    WHEN 'Senior' THEN 'mid_senior'
    WHEN 'Lead/Executive' THEN 'director'
    ELSE 'associate'
  END)::public.career_level;

  IF NEW.source_url IS NULL THEN
    NEW.source_url := NEW.external_url;
  END IF;

  RETURN NEW;
END;
$function$;

-- Backfill existing rows through the trigger
UPDATE public.jobs SET title = title;

-- Application tracker
CREATE TABLE public.job_applications (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  job_id uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'applied' CHECK (status IN ('saved','applied','interviewing','offered','rejected')),
  notes text,
  applied_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, job_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.job_applications TO authenticated;
GRANT ALL ON public.job_applications TO service_role;

ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own job applications"
ON public.job_applications
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER job_applications_updated_at
BEFORE UPDATE ON public.job_applications
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE INDEX idx_job_applications_user ON public.job_applications(user_id);
CREATE INDEX idx_job_applications_user_status ON public.job_applications(user_id, status);