import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type Job = Tables<"jobs">;

export const useJobs = () => {
  return useQuery({
    queryKey: ["jobs"],
    queryFn: async () => {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const { data, error } = await supabase
        .from("jobs")
        .select("*")
        .eq("is_published", true)
        .gte("created_at", thirtyDaysAgo)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Job[];
    },
  });
};
