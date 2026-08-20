import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { FunctionsHttpError } from "@supabase/supabase-js";
import type { RecruiterStatus } from "@/lib/profile-display";

export interface RecruiterReviewRow {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  company_name: string | null;
  company_title: string | null;
  company_email: string | null;
  company_website: string | null;
  linkedin_url: string | null;
  hiring_roles: string[] | null;
  recruiter_status: RecruiterStatus;
  created_at: string;
}

export const useRecruiterReviewList = () =>
  useQuery({
    queryKey: ["recruiterReview"],
    queryFn: async (): Promise<RecruiterReviewRow[]> => {
      const { data, error } = await supabase
        .from("profiles")
        .select(
          "id, full_name, avatar_url, company_name, company_title, company_email, company_website, linkedin_url, hiring_roles, recruiter_status, created_at",
        )
        .eq("profile_type", "recruiter")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data ?? []) as RecruiterReviewRow[];
    },
  });

interface DecisionInput {
  recruiterId: string;
  status: "approved" | "rejected";
  note?: string;
}

export interface DecisionResult {
  status: "approved" | "rejected";
  emailSent: boolean;
  emailError?: string | null;
}

export const useRecruiterDecision = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ recruiterId, status, note }: DecisionInput): Promise<DecisionResult> => {
      const { data, error } = await supabase.functions.invoke("recruiter-status", {
        body: { recruiterId, status, note },
      });

      if (error) {
        const details =
          error instanceof FunctionsHttpError ? await error.context.text() : error.message;
        let message = details;
        try {
          message = JSON.parse(details)?.error ?? details;
        } catch {
          /* keep raw text */
        }
        throw new Error(message);
      }

      return {
        status,
        emailSent: Boolean(data?.emailSent),
        emailError: data?.emailError ?? null,
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recruiterReview"] });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
  });
};
