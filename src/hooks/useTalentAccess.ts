import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface TalentQuota {
  uncapped: boolean;
  views_used?: number;
  views_limit?: number;
  contacts_used?: number;
  contacts_limit?: number;
}

export interface TalentAccessResult {
  allowed: boolean;
  uncapped: boolean;
  remaining: number | null;
  limit: number | null;
}

/** Server-side daily quota for the current viewer. Recruiters/admins are uncapped. */
export const useTalentQuota = (enabled = true) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["talent-quota", user?.id],
    enabled: !!user?.id && enabled,
    queryFn: async (): Promise<TalentQuota> => {
      const { data, error } = await supabase.rpc("talent_access_quota" as any);
      if (error) throw error;
      return (data ?? { uncapped: true }) as unknown as TalentQuota;
    },
  });
};

/**
 * Records a talent access event (profile view or intro request) and returns whether
 * it was allowed. Enforcement lives in the database, so this cannot be bypassed.
 */
export const useRecordTalentAccess = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      targetId,
      kind,
    }: {
      targetId: string;
      kind: "view" | "contact";
    }): Promise<TalentAccessResult> => {
      const { data, error } = await supabase.rpc("record_talent_access" as any, {
        _target_id: targetId,
        _kind: kind,
      });
      if (error) throw error;
      return data as unknown as TalentAccessResult;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["talent-quota", user?.id] });
    },
  });
};
