import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { Tables } from "@/integrations/supabase/types";

export type Profile = Tables<"profiles">;

export const useAllProfiles = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["all-profiles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .neq("id", user?.id || "") // Exclude current user from the list
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Profile[];
    },
    enabled: !!user?.id,
  });
};
