import { useProfile } from "@/hooks/useProfile";
import { useAdminRole } from "@/hooks/useAdminRole";
import { isRecruiter, recruiterStatus, isRecruiterRestricted } from "@/lib/profile-display";

/**
 * Mirrors the database rules: recruiters whose account is not `approved`
 * cannot search students, send direct messages, or create posts.
 */
export const useRecruiterGate = () => {
  const { data: profile, isLoading } = useProfile();
  const { isAdmin, isLoading: adminLoading } = useAdminRole();

  const status = recruiterStatus(profile);
  const restricted = isRecruiterRestricted(profile, isAdmin);

  return {
    isLoading: isLoading || adminLoading,
    isAdmin,
    isRecruiter: isRecruiter(profile),
    status,
    restricted,
    canPost: !restricted,
    canMessage: !restricted,
    canSearchStudents: !restricted,
  };
};
