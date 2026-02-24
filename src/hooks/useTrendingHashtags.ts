import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useTrendingHashtags = (limit = 5) => {
  return useQuery({
    queryKey: ["trending-hashtags", limit],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_trending_hashtags", {
        limit_count: limit,
      });

      if (error) throw error;
      return data as { hashtag: string; post_count: number }[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
