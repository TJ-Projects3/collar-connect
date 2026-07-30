import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type AvailabilityValue =
  | "summer_intern"
  | "fall_coop"
  | "part_time"
  | "full_time_new_grad"
  | "not_looking";

export const AVAILABILITY_OPTIONS: { value: AvailabilityValue; label: string }[] = [
  { value: "summer_intern", label: "Summer Intern" },
  { value: "fall_coop", label: "Fall Co-op" },
  { value: "part_time", label: "Part-time" },
  { value: "full_time_new_grad", label: "Full-time / New Grad" },
  { value: "not_looking", label: "Not looking" },
];

export const availabilityLabel = (value?: string | null) =>
  AVAILABILITY_OPTIONS.find((o) => o.value === value)?.label ?? null;

type ProfileRow = Tables<"profiles">;
type ProjectRow = Tables<"student_projects">;

export interface Candidate {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  university: string | null;
  major: string | null;
  graduation_year: number | null;
  availability: string | null;
  bio: string | null;
  skills: string[];
  topProject: ProjectRow | null;
  projectCount: number;
  isVerifiedIntern: boolean;
}

export interface TalentFilterState {
  search: string;
  techStack: string[];
  gradYears: string[];
  universities: string[];
  availability: string[];
}

export const EMPTY_FILTERS: TalentFilterState = {
  search: "",
  techStack: [],
  gradYears: [],
  universities: [],
  availability: [],
};

export const useTalentCandidates = () => {
  return useQuery({
    queryKey: ["talent-candidates"],
    queryFn: async () => {
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select(
          "id, full_name, avatar_url, university, major, graduation_year, availability, bio, created_at"
        )
        .eq("profile_type", "student")
        .order("created_at", { ascending: false });

      if (profilesError) throw profilesError;

      const rows = (profiles || []) as unknown as ProfileRow[];
      const ids = rows.map((r) => r.id);

      let projectsByUser: Record<string, ProjectRow[]> = {};
      if (ids.length > 0) {
        const { data: projects, error: projectsError } = await supabase
          .from("student_projects")
          .select("*")
          .in("user_id", ids)
          .order("display_order", { ascending: true })
          .order("created_at", { ascending: false });

        if (projectsError) throw projectsError;

        projectsByUser = (projects || []).reduce<Record<string, ProjectRow[]>>((acc, p: any) => {
          acc[p.user_id] = acc[p.user_id] ? [...acc[p.user_id], p] : [p];
          return acc;
        }, {});
      }

      const candidates: Candidate[] = rows.map((p) => {
        const projects = projectsByUser[p.id] || [];

        // Rank skills by how often they appear across the student's projects.
        const counts = new Map<string, number>();
        projects.forEach((proj) => {
          (proj.tech_stack || []).forEach((t) => {
            const key = t.trim();
            if (!key) return;
            counts.set(key, (counts.get(key) ?? 0) + 1);
          });
        });
        const skills = Array.from(counts.entries())
          .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
          .map(([skill]) => skill);

        const verifiedProject = projects.find((proj) => proj.achievement_verified);
        const withCover = projects.find((proj) => !!proj.cover_image_url);

        return {
          id: p.id,
          full_name: p.full_name,
          avatar_url: p.avatar_url,
          university: p.university,
          major: p.major,
          graduation_year: p.graduation_year,
          availability: (p as any).availability ?? null,
          bio: p.bio,
          skills,
          topProject: verifiedProject ?? withCover ?? projects[0] ?? null,
          projectCount: projects.length,
          isVerifiedIntern: !!verifiedProject,
        };
      });

      return candidates;
    },
  });
};

export const useTalentFilterOptions = (candidates: Candidate[] | undefined) =>
  useMemo(() => {
    const tech = new Set<string>();
    const years = new Set<string>();
    const universities = new Set<string>();
    const availability = new Set<string>();

    (candidates || []).forEach((c) => {
      c.skills.forEach((s) => tech.add(s));
      if (c.graduation_year) years.add(String(c.graduation_year));
      if (c.university?.trim()) universities.add(c.university.trim());
      if (c.availability) availability.add(c.availability);
    });

    return {
      techStack: Array.from(tech).sort((a, b) => a.localeCompare(b)),
      gradYears: Array.from(years).sort(),
      universities: Array.from(universities).sort((a, b) => a.localeCompare(b)),
      availability: AVAILABILITY_OPTIONS.filter((o) => availability.has(o.value)),
    };
  }, [candidates]);

export const filterCandidates = (
  candidates: Candidate[] | undefined,
  filters: TalentFilterState
): Candidate[] => {
  const search = filters.search.trim().toLowerCase();

  return (candidates || []).filter((c) => {
    if (search) {
      const haystack = [c.full_name, c.university, c.major, c.topProject?.title, ...c.skills]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(search)) return false;
    }

    if (filters.techStack.length > 0) {
      const lower = c.skills.map((s) => s.toLowerCase());
      const hasAll = filters.techStack.every((t) => lower.includes(t.toLowerCase()));
      if (!hasAll) return false;
    }

    if (filters.gradYears.length > 0) {
      if (!c.graduation_year || !filters.gradYears.includes(String(c.graduation_year))) return false;
    }

    if (filters.universities.length > 0) {
      if (!c.university || !filters.universities.includes(c.university.trim())) return false;
    }

    if (filters.availability.length > 0) {
      if (!c.availability || !filters.availability.includes(c.availability)) return false;
    }

    return true;
  });
};
