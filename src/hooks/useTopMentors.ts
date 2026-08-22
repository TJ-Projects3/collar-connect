import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface TopMentor {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  job_title: string | null;
  company: string | null;
  profile_type: string | null;
  industry_role_title: string | null;
  industry_company: string | null;
  industry_verified: boolean | null;
  mentorship_opt_in: boolean | null;
  mentorship_offerings: string[] | null;
  booking_url: string | null;
  answer_count: number;
}

/** Industry mentors open to mentoring, ranked by Q&A answer activity. */
export const useTopMentors = (limit = 5) => {
  return useQuery({
    queryKey: ["top-mentors", limit],
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<TopMentor[]> => {
      const { data, error } = await supabase
        .from("profiles")
        .select(
          "id, full_name, avatar_url, job_title, company, profile_type, industry_role_title, industry_company, industry_verified, mentorship_opt_in, mentorship_offerings, booking_url"
        )
        .eq("profile_type", "industry")
        .eq("mentorship_opt_in", true)
        .limit(50);
      if (error) throw error;

      const mentors = (data ?? []) as any[];
      if (!mentors.length) return [];

      const ids = mentors.map((m) => m.id);
      const { data: answers, error: answerError } = await supabase
        .from("question_answers")
        .select("author_id")
        .in("author_id", ids)
        .eq("is_anonymous", false)
        .limit(1000);
      if (answerError) throw answerError;

      const counts = new Map<string, number>();
      ((answers ?? []) as { author_id: string }[]).forEach((a) =>
        counts.set(a.author_id, (counts.get(a.author_id) ?? 0) + 1)
      );

      return mentors
        .map((m) => ({ ...m, answer_count: counts.get(m.id) ?? 0 }))
        .sort(
          (a, b) =>
            b.answer_count - a.answer_count ||
            (a.full_name ?? "").localeCompare(b.full_name ?? "")
        )
        .slice(0, limit) as TopMentor[];
    },
  });
};
