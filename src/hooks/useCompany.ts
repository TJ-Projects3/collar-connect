import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface Company {
  id: string;
  owner_id: string;
  name: string;
  logo_url: string | null;
  website: string | null;
  company_size: string | null;
  industry: string | null;
  description: string | null;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

export type CompanyInput = {
  name: string;
  logo_url?: string | null;
  website?: string | null;
  company_size?: string | null;
  industry?: string | null;
  description?: string | null;
};

export const COMPANY_SIZE_OPTIONS = [
  "1-10",
  "11-50",
  "51-200",
  "201-1000",
  "1001-5000",
  "5000+",
];

/** The company profile owned by a given user (defaults to the signed-in user). */
export const useCompany = (userId?: string) => {
  const { user } = useAuth();
  const ownerId = userId ?? user?.id;

  return useQuery({
    queryKey: ["company", ownerId],
    enabled: !!ownerId,
    queryFn: async (): Promise<Company | null> => {
      const { data, error } = await supabase
        .from("companies")
        .select("*")
        .eq("owner_id", ownerId!)
        .maybeSingle();

      if (error) throw error;
      return (data as unknown as Company) ?? null;
    },
  });
};

export const useSaveCompany = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (input: CompanyInput) => {
      if (!user?.id) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("companies")
        .upsert({ ...input, owner_id: user.id }, { onConflict: "owner_id" })
        .select()
        .single();

      if (error) throw error;
      return data as unknown as Company;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["company", user?.id] });
    },
  });
};
