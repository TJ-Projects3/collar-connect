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

  FUNCTION_PLACEHOLDER boolean;
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

  ---------------------------------------------------------------- track (title first)
  NEW.track := CASE
    WHEN t ~ '(cyber|infosec|information security|\ysoc\y|penetration test|pentest|threat|vulnerab|appsec|security)' THEN 'Cybersecurity'
    WHEN t ~ '(machine learning|\yml\y|artificial intelligence|\yai\y|data scien|data engineer|data analyst|analytics|\ynlp\y|\yllm\y|big data|\ybi\y)' THEN 'Data & AI'
    WHEN t ~ '(devops|\ysre\y|site reliability|kubernetes|terraform|cloud|platform engineer|infrastructure)' THEN 'Cloud/DevOps'
    WHEN t ~ '(\yios\y|android|mobile|swift|kotlin|react native|flutter)' THEN 'Mobile'
    WHEN t ~ '(front[ -]?end|react|angular|\yvue\y|\yui\y|web developer)' THEN 'Frontend'
    WHEN t ~ '(back[ -]?end|\yapi\y|\yjava\y|golang|\y\.net\y|node|python)' THEN 'Backend'
    WHEN t ~ '(help ?desk|system(s)? admin|sysadmin|network|desktop support|\yit\y support|technical support|systems engineer)' THEN 'IT/Systems'
    WHEN t ~ '(software|developer|engineer|programmer|full[ -]?stack)' THEN 'Software Engineering'
    WHEN d ~ '(cyber|infosec|penetration test|appsec)' THEN 'Cybersecurity'
    WHEN d ~ '(machine learning|data scien|data engineer|analytics)' THEN 'Data & AI'
    WHEN d ~ '(devops|kubernetes|site reliability)' THEN 'Cloud/DevOps'
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

UPDATE public.jobs SET title = title;