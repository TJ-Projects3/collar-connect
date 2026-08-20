// Helpers for role-aware profile display and talent access

type AnyProfile = {
  profile_type?: string | null;
  job_title?: string | null;
  company?: string | null;
  company_name?: string | null;
  company_title?: string | null;
  university?: string | null;
  major?: string | null;
  graduation_year?: number | null;
  industry_role_title?: string | null;
  industry_company?: string | null;
  industry_verified?: boolean | null;
  current_role?: string | null;
  current_company?: string | null;
  recruiter_status?: string | null;
} | null | undefined;

export const isRecruiter = (p: AnyProfile) => p?.profile_type === "recruiter";
export const isIndustry = (p: AnyProfile) => p?.profile_type === "industry";
export const isIndustryVerified = (p: AnyProfile) => isIndustry(p) && p?.industry_verified === true;

export type RecruiterStatus = "pending" | "approved" | "rejected";

export const recruiterStatus = (p: AnyProfile): RecruiterStatus | null =>
  isRecruiter(p) ? ((p?.recruiter_status as RecruiterStatus) ?? "pending") : null;

export const isRecruiterApproved = (p: AnyProfile) => recruiterStatus(p) === "approved";

/**
 * Recruiters awaiting review (or rejected) cannot search students, send DMs,
 * or post announcements. Enforced in RLS; this mirrors it for UX.
 */
export const isRecruiterRestricted = (p: AnyProfile, isAdmin?: boolean) =>
  !isAdmin && isRecruiter(p) && !isRecruiterApproved(p);

/**
 * Tiered talent access.
 * - "full": approved recruiters and admins. Everything, no caps.
 * - "scoped": verified industry accounts. No resume/contact email, capped, intro requests only.
 * - "none": everyone else, including recruiters pending review.
 */
export type TalentAccessLevel = "full" | "scoped" | "none";

export const talentAccessLevel = (p: AnyProfile, isAdmin?: boolean): TalentAccessLevel => {
  if (isAdmin) return "full";
  if (isRecruiter(p)) return isRecruiterApproved(p) ? "full" : "none";
  if (isIndustryVerified(p)) return "scoped";
  return "none";
};

export const canViewTalent = (p: AnyProfile, isAdmin?: boolean) =>
  talentAccessLevel(p, isAdmin) !== "none";


export const getIndustryHeadline = (p: AnyProfile): string => {
  const role = p?.current_role || p?.industry_role_title;
  const company = p?.current_company || p?.industry_company;
  const parts = [role, company].filter(Boolean) as string[];
  return parts.join(" @ ");
};


export const getProfileSubline = (p: AnyProfile, fallback = "Member"): string => {
  if (!p) return fallback;

  if (isRecruiter(p)) {
    const parts = [p.company_title, p.company_name].filter(Boolean) as string[];
    if (parts.length) return parts.join(" @ ");
    // No role duplication: the recruiter pill next to the name already says it.
    return "";
  }

  if (isIndustry(p)) {
    // The industry pill next to the name already carries the company name.
    const headline = getIndustryHeadline(p);
    if (headline) return headline;
    const work = [p.job_title, p.company].filter(Boolean) as string[];
    if (work.length) return work.join(" @ ");
    return "";
  }

  // Student / default
  const academic = [p.major, p.university].filter(Boolean) as string[];
  if (academic.length) return academic.join(" · ");
  if (p.graduation_year) return `Class of ${p.graduation_year}`;

  const work = [p.job_title, p.company].filter(Boolean) as string[];
  if (work.length) return work.join(" @ ");

  return fallback;
};
