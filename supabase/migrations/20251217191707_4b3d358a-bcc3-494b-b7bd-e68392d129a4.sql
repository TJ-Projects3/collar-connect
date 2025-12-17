-- Insert profile for tiwaplays@gmail.com
INSERT INTO public.profiles (id, full_name, job_title, company, location, bio)
VALUES (
  'a19c3e3e-ac5e-43d0-973e-84f9a980fa3d',
  'Tiwa Plays',
  'Software Engineer',
  'NextGen Collar',
  'San Francisco, CA',
  'Passionate about diversity and inclusion in the tech industry. Building tools to empower underrepresented communities.'
);

-- Assign admin role
INSERT INTO public.user_roles (user_id, role)
VALUES (
  'a19c3e3e-ac5e-43d0-973e-84f9a980fa3d',
  'admin'
);