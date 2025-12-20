-- Create enums for job filtering
CREATE TYPE public.career_level AS ENUM ('internship', 'entry_level', 'associate', 'mid_senior', 'director', 'executive');
CREATE TYPE public.work_arrangement AS ENUM ('remote', 'hybrid', 'on_site');

-- Create the jobs table
CREATE TABLE public.jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  company TEXT NOT NULL,
  location TEXT,
  career_level public.career_level NOT NULL,
  work_arrangement public.work_arrangement NOT NULL,
  external_url TEXT,
  is_published BOOLEAN DEFAULT false,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view published jobs"
ON public.jobs
FOR SELECT
USING (is_published = true);

CREATE POLICY "Admins can manage all jobs"
ON public.jobs
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Add updated_at trigger
CREATE TRIGGER update_jobs_updated_at
BEFORE UPDATE ON public.jobs
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Migrate existing job resources to the jobs table (if any exist)
INSERT INTO public.jobs (title, description, company, location, career_level, work_arrangement, external_url, is_published, created_by, created_at)
SELECT 
  title,
  COALESCE(description, content),
  COALESCE(company, 'Unknown Company'),
  location,
  'entry_level'::public.career_level,
  'on_site'::public.work_arrangement,
  external_url,
  is_published,
  created_by,
  created_at
FROM public.resources
WHERE resource_type = 'job';