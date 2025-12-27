-- Security: Add constraints to prevent XSS via javascript: protocol URLs
-- Only allow http:// and https:// URLs in external_url, file_url, and image_url fields

-- Add constraint for external_url in resources table
ALTER TABLE public.resources
ADD CONSTRAINT external_url_scheme_check
CHECK (
  external_url IS NULL OR
  external_url ~ '^https?://'
);

-- Add constraint for file_url in resources table
ALTER TABLE public.resources
ADD CONSTRAINT file_url_scheme_check
CHECK (
  file_url IS NULL OR
  file_url ~ '^https?://'
);

-- Add constraint for image_url in resources table
ALTER TABLE public.resources
ADD CONSTRAINT image_url_scheme_check
CHECK (
  image_url IS NULL OR
  image_url ~ '^https?://'
);

-- Add constraint for external_url in jobs table (if exists)
ALTER TABLE public.jobs
ADD CONSTRAINT jobs_external_url_scheme_check
CHECK (
  external_url IS NULL OR
  external_url ~ '^https?://'
);

-- Add constraint for virtual_link in events table
ALTER TABLE public.events
ADD CONSTRAINT virtual_link_scheme_check
CHECK (
  virtual_link IS NULL OR
  virtual_link ~ '^https?://'
);

-- Add constraint for image_url in events table
ALTER TABLE public.events
ADD CONSTRAINT events_image_url_scheme_check
CHECK (
  image_url IS NULL OR
  image_url ~ '^https?://'
);

COMMENT ON CONSTRAINT external_url_scheme_check ON public.resources IS
'Security: Prevent XSS via javascript: protocol URLs. Only allow HTTP and HTTPS schemes.';

COMMENT ON CONSTRAINT file_url_scheme_check ON public.resources IS
'Security: Prevent XSS via javascript: protocol URLs. Only allow HTTP and HTTPS schemes.';

COMMENT ON CONSTRAINT image_url_scheme_check ON public.resources IS
'Security: Prevent XSS via javascript: protocol URLs. Only allow HTTP and HTTPS schemes.';

COMMENT ON CONSTRAINT jobs_external_url_scheme_check ON public.jobs IS
'Security: Prevent XSS via javascript: protocol URLs. Only allow HTTP and HTTPS schemes.';

COMMENT ON CONSTRAINT virtual_link_scheme_check ON public.events IS
'Security: Prevent XSS via javascript: protocol URLs. Only allow HTTP and HTTPS schemes.';

COMMENT ON CONSTRAINT events_image_url_scheme_check ON public.events IS
'Security: Prevent XSS via javascript: protocol URLs. Only allow HTTP and HTTPS schemes.';
