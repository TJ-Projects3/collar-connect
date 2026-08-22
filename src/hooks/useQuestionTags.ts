import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface TagCount {
  tag: string;
  count: number;
}

/** Most active Q&A tags across recent questions. */
export const useQuestionTagCounts = (limit = 8, days = 60) => {
  return useQuery({
    queryKey: ["question-tag-counts", limit, days],
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<TagCount[]> => {
      const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
      const { data, error } = await supabase
        .from("questions")
        .select("tags")
        .gte("created_at", since)
        .limit(500);
      if (error) throw error;

      const counts = new Map<string, number>();
      ((data ?? []) as { tags: string[] | null }[]).forEach((row) => {
        (row.tags ?? []).forEach((raw) => {
          const tag = (raw ?? "").trim().toLowerCase();
          if (!tag) return;
          counts.set(tag, (counts.get(tag) ?? 0) + 1);
        });
      });

      return Array.from(counts.entries())
        .map(([tag, count]) => ({ tag, count }))
        .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag))
        .slice(0, limit);
    },
  });
};
