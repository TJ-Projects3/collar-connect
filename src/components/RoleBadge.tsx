import { RecruiterBadge } from "@/components/RecruiterBadge";
import { IndustryBadge } from "@/components/IndustryBadge";
import { StudentBadge } from "@/components/StudentBadge";
import { isRecruiter, isIndustry, recruiterStatus, isRecruiterApproved } from "@/lib/profile-display";

interface RoleBadgeProps {
  /** Any profile-shaped object (feed author, reply author, profile row). */
  profile: any;
  size?: "sm" | "lg";
  /** Drop the trailing school/company detail for tight inline rows. */
  compact?: boolean;
  className?: string;
}

/**
 * One pill that tells you at a glance whether someone is a student,
 * a recruiter, or an industry professional. Renders nothing when the
 * role is unknown.
 */
export const RoleBadge = ({ profile, size = "sm", compact, className }: RoleBadgeProps) => {
  if (!profile) return null;

  if (isRecruiter(profile)) {
    return (
      <RecruiterBadge
        size={size}
        compact={compact}
        verified={isRecruiterApproved(profile)}
        status={recruiterStatus(profile)}
        company={compact ? null : profile.company_name}
        className={className}
      />
    );
  }

  if (isIndustry(profile)) {
    return (
      <IndustryBadge
        size={size}
        verified={profile.industry_verified === true}
        mentor={profile.mentorship_opt_in === true}
        companyName={
          compact ? null : profile.current_company || profile.industry_company || profile.company
        }
        className={className}
      />
    );
  }

  if (profile.profile_type === "student") {
    return (
      <StudentBadge
        size={size}
        compact={compact}
        school={profile.university}
        graduationYear={profile.graduation_year}
        className={className}
      />
    );
  }

  return null;
};
