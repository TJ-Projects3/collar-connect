import { useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { useAllProfiles, type Profile } from "@/hooks/useAllProfiles";
import { useMyConnections } from "@/hooks/useConnections";
import { useBlockedIds } from "@/hooks/useBlockedUsers";

export interface PeerMatch {
  profile: Profile;
  score: number;
  reasons: string[];
}

const norm = (s: string) => s.trim().toLowerCase();

const skillsOf = (p: Profile): string[] => {
  const list = [...(p.areas_of_expertise ?? [])];
  if (Array.isArray(p.featured_projects)) {
    // tech mentioned in featured projects adds signal
    for (const item of p.featured_projects as unknown[]) {
      const tech = (item as { tech_stack?: unknown })?.tech_stack;
      if (Array.isArray(tech)) list.push(...(tech as string[]));
    }
  }
  return Array.from(new Set(list.filter(Boolean).map(norm)));
};

const roleOf = (p: Profile) => norm(p.job_title || p.current_role || "");

export const useRecommendedPeers = (limit = 5) => {
  const { user } = useAuth();
  const { data: me } = useProfile();
  const { data: profiles = [], isLoading } = useAllProfiles();
  const { data: connections = [] } = useMyConnections();
  const { data: blockedIds } = useBlockedIds();

  const peers = useMemo<PeerMatch[]>(() => {
    if (!me || !user?.id) return [];

    const mySkills = new Set(skillsOf(me as Profile));
    const myRole = roleOf(me as Profile);
    const myYear = me.graduation_year;
    const myUni = norm(me.university || "");
    const myMajor = norm(me.major || "");

    const connectedIds = new Set<string>();
    for (const c of connections as Array<{ requester_id: string; receiver_id: string }>) {
      connectedIds.add(c.requester_id === user.id ? c.receiver_id : c.requester_id);
    }

    const matches: PeerMatch[] = [];

    for (const p of profiles) {
      if (p.id === user.id) continue;
      if (p.profile_type !== "student") continue;
      if (connectedIds.has(p.id)) continue;
      if (blockedIds?.has(p.id)) continue;

      let score = 0;
      const reasons: string[] = [];

      const shared = skillsOf(p).filter((s) => mySkills.has(s));
      if (shared.length) {
        score += shared.length * 5;
        reasons.push(`Also into ${shared.slice(0, 3).join(", ")}`);
      }

      const theirRole = roleOf(p);
      if (myRole && theirRole && myRole === theirRole) {
        score += 4;
        reasons.push(`Targeting ${p.job_title || p.current_role}`);
      }

      if (myYear && p.graduation_year === myYear) {
        score += 3;
        reasons.push(`Class of ${myYear}`);
      }

      const theirUni = norm(p.university || "");
      if (myUni && theirUni === myUni) {
        score += 2;
        reasons.push(p.university!);
      }

      const theirMajor = norm(p.major || "");
      if (myMajor && theirMajor === myMajor) {
        score += 1;
        reasons.push(p.major!);
      }

      if (score > 0) matches.push({ profile: p, score, reasons });
    }

    return matches.sort((a, b) => b.score - a.score).slice(0, limit);
  }, [profiles, connections, blockedIds, me, user?.id, limit]);

  return {
    peers,
    isLoading,
    isStudent: me?.profile_type === "student",
  };
};
