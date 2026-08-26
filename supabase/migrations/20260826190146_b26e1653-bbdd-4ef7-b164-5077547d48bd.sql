ALTER TABLE public.jobs
  ADD COLUMN IF NOT EXISTS experience_level text,
  ADD COLUMN IF NOT EXISTS is_internship boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS track text,
  ADD COLUMN IF NOT EXISTS source_url text;

CREATE OR REPLACE FUNCTION public.normalize_job_classification()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
DECLARE
  t text := lower(coalesce(NEW.title, ''));
  d text := lower(left(coalesce(NEW.description, ''), 4000));
  td text;
  yrs int;
  m text[];
BEGIN
  td := t || ' ' || d;

  ---------------------------------------------------------------- internship
  IF t ~ '(intern|internship|co-?op|fellow|fellowship|apprentice)'
     OR d ~ '(summer intern|internship program|co-?op program)' THEN
    NEW.is_internship := true;
    NEW.experience_level := 'Internship';

  ---------------------------------------------------------------- lead / exec
  ELSIF t ~ '(director|vice president|\yvp\y|\yhead of\y|chief|cto|\ycio\y|distinguished)' THEN
    NEW.is_internship := false;
    NEW.experience_level := 'Lead/Executive';

  ---------------------------------------------------------------- senior
  ELSIF t ~ '(senior|\ysr\.?\y|staff|principal|\ylead\y|architect|manager|\yiv\y|\yv\y\s*$)' THEN
    NEW.is_internship := false;
    NEW.experience_level := 'Senior';

  ---------------------------------------------------------------- entry
  ELSIF t ~ '(junior|\yjr\.?\y|entry[ -]?level|new ?grad|graduate|associate|trainee|\yi\y\s*$)' THEN
    NEW.is_internship := false;
    NEW.experience_level := 'Entry Level';

  ELSIF t ~ '(\ymid\y|\yii\y|\yiii\y)' THEN
    NEW.is_internship := false;
    NEW.experience_level := 'Mid Level';

  ELSE
    NEW.is_internship := false;
    -- fall back to years-of-experience cues in the description
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

  ---------------------------------------------------------------- guard rail
  IF NEW.experience_level = 'Entry Level'
     AND t ~ '(senior|\ysr\.?\y|staff|principal|\ylead\y|director|architect|\yvp\y|manager)' THEN
    NEW.experience_level := 'Senior';
  END IF;

  ---------------------------------------------------------------- track
  IF td ~ '(cyber|infosec|information security|\ysoc\y|penetration test|pentest|threat|vulnerab|appsec)' THEN
    NEW.track := 'Cybersecurity';
  ELSIF td ~ '(machine learning|\yml\y|artificial intelligence|\yai\y|data scien|data engineer|data analyst|analytics|\ynlp\y|\yllm\y|big data)' THEN
    NEW.track := 'Data & AI';
  ELSIF td ~ '(devops|\ysre\y|site reliability|kubernetes|terraform|cloud engineer|platform engineer|infrastructure engineer|\yaws\y|azure|\ygcp\y)' THEN
    NEW.track := 'Cloud/DevOps';
  ELSIF td ~ '(\yios\y|android|mobile (developer|engineer)|swift|kotlin|react native|flutter)' THEN
    NEW.track := 'Mobile';
  ELSIF td ~ '(front[ -]?end|react|angular|\yvue\y|\yui\y engineer|web developer)' THEN
    NEW.track := 'Frontend';
  ELSIF td ~ '(back[ -]?end|\yapi\y|microservice|\yjava\y|golang|\ygo\y developer|\y\.net\y|node\.js|python developer)' THEN
    NEW.track := 'Backend';
  ELSIF td ~ '(help ?desk|system administrator|sysadmin|network (engineer|administrator)|desktop support|\yit\y support|technical support)' THEN
    NEW.track := 'IT/Systems';
  ELSIF td ~ '(software|developer|engineer|programmer|full[ -]?stack)' THEN
    NEW.track := 'Software Engineering';
  ELSE
    NEW.track := coalesce(NEW.track, 'Other');
  END IF;

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

DROP TRIGGER IF EXISTS normalize_job_classification_trg ON public.jobs;
CREATE TRIGGER normalize_job_classification_trg
  BEFORE INSERT OR UPDATE ON public.jobs
  FOR EACH ROW EXECUTE FUNCTION public.normalize_job_classification();

-- Backfill existing rows through the classifier
UPDATE public.jobs SET title = title;

CREATE INDEX IF NOT EXISTS jobs_is_internship_idx ON public.jobs (is_internship);
CREATE INDEX IF NOT EXISTS jobs_experience_level_idx ON public.jobs (experience_level);
CREATE INDEX IF NOT EXISTS jobs_track_idx ON public.jobs (track);