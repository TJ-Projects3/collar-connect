import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type Resource = Tables<"resources">;

export const useFeaturedResources = (limit = 3) => {
  return useQuery({
    queryKey: ["featured-resources", limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("resources")
        .select("id, title, description, resource_type, external_url, image_url")
        .eq("is_published", true)
        .eq("is_featured", true)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data;
    },
  });
};
