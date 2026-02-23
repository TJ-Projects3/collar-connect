-- Add point of contact fields to jobs table
ALTER TABLE jobs
ADD COLUMN IF NOT EXISTS contact_name TEXT,
ADD COLUMN IF NOT EXISTS contact_email TEXT,
ADD COLUMN IF NOT EXISTS contact_phone TEXT,
ADD COLUMN IF NOT EXISTS contact_url TEXT;

-- Add comment for documentation
COMMENT ON COLUMN jobs.contact_name IS 'Name of the point of contact for this job posting';
COMMENT ON COLUMN jobs.contact_email IS 'Email address to contact about this job posting';
COMMENT ON COLUMN jobs.contact_phone IS 'Phone number to contact about this job posting';
COMMENT ON COLUMN jobs.contact_url IS 'URL for contacting about this job posting';
