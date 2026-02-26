import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { CareerResults } from "@/lib/career-scoring";

export const useCareerAssessment = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["career-assessment", user?.id],
    queryFn: async () => {
      const { data, error } = await (supabase
        .from("career_assessments") as any)
        .select("*")
        .eq("user_id", user!.id)
        .order("completed_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });
};

export const useSaveAssessment = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      answers,
      results,
    }: {
      answers: Record<number, number>;
      results: CareerResults;
    }) => {
      const { data, error } = await (supabase
        .from("career_assessments") as any)
        .insert({
          user_id: user!.id,
          answers: answers as unknown as Record<string, unknown>,
          results: results as unknown as Record<string, unknown>,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["career-assessment", user?.id] });
    },
  });
};

export const useDeleteAssessment = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (assessmentId: string) => {
      const { error } = await (supabase
        .from("career_assessments") as any)
        .delete()
        .eq("id", assessmentId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["career-assessment", user?.id] });
    },
  });
};
