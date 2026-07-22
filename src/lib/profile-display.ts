// Helpers for role-aware profile display

type AnyProfile = {
  profile_type?: string | null;
  job_title?: string | null;
  company?: string | null;
  company_name?: string | null;
  company_title?: string | null;
  university?: string | null;
  major?: string | null;
  graduation_year?: number | null;
} | null | undefined;

export const isRecruiter = (p: AnyProfile) => p?.profile_type === "recruiter";

export const getProfileSubline = (p: AnyProfile, fallback = "Member"): string => {
  if (!p) return fallback;

  if (isRecruiter(p)) {
    const parts = [p.company_title, p.company_name].filter(Boolean) as string[];
    if (parts.length) return parts.join(" @ ");
    return "Hiring Recruiter";
  }

  // Student / default
  const academic = [p.major, p.university].filter(Boolean) as string[];
  if (academic.length) return academic.join(" · ");
  if (p.graduation_year) return `Class of ${p.graduation_year}`;

  const work = [p.job_title, p.company].filter(Boolean) as string[];
  if (work.length) return work.join(" @ ");

  return fallback;
};
