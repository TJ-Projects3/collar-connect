import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { FunctionsHttpError } from "@supabase/supabase-js";

export interface ThreadSummary {
  question_id: string;
  bullets: string[];
  takeaway: string | null;
  answer_count: number;
  updated_at: string;
}

export const useThreadSummary = (questionId: string | null) =>
  useQuery({
    queryKey: ["thread-summary", questionId],
    enabled: !!questionId,
    queryFn: async (): Promise<ThreadSummary | null> => {
      const { data, error } = await supabase
        .from("question_summaries")
        .select("question_id, bullets, takeaway, answer_count, updated_at")
        .eq("question_id", questionId!)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      return {
        ...data,
        bullets: Array.isArray(data.bullets) ? (data.bullets as string[]) : [],
      };
    },
  });

interface SummarizeInput {
  questionId: string;
  title: string;
  question: string;
  answers: string[];
}

export const useSummarizeThread = () => {
  const qc = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ questionId, title, question, answers }: SummarizeInput) => {
      if (!user?.id) throw new Error("Sign in to summarize this discussion.");

      const { data, error } = await supabase.functions.invoke("summarize-thread", {
        body: { title, question, answers },
      });

      if (error) {
        const details =
          error instanceof FunctionsHttpError
            ? await error.context.text()
            : error.message;
        let message = details;
        try {
          const parsed = JSON.parse(details);
          if (typeof parsed?.error === "string") message = parsed.error;
        } catch {
          /* keep raw text */
        }
        throw new Error(message || "Could not generate a summary.");
      }

      const bullets: string[] = Array.isArray(data?.bullets) ? data.bullets : [];
      const takeaway: string = data?.takeaway ?? "";
      if (!bullets.length) throw new Error("The summary came back empty. Try again.");

      const { error: saveError } = await supabase
        .from("question_summaries")
        .upsert(
          {
            question_id: questionId,
            bullets,
            takeaway,
            answer_count: answers.length,
            generated_by: user.id,
          },
          { onConflict: "question_id" },
        );
      if (saveError) throw saveError;

      return { bullets, takeaway, answer_count: answers.length };
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["thread-summary", vars.questionId] });
    },
  });
};
