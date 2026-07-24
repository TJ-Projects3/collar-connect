import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

export type QuestionSort = "new" | "top" | "unanswered";

export interface QuestionAuthor {
  id: string;
  full_name: string | null;
  job_title: string | null;
  company: string | null;
  avatar_url: string | null;
  profile_type: string | null;
  is_verified_recruiter: boolean | null;
}

export interface Question {
  id: string;
  author_id: string;
  title: string;
  body: string;
  tags: string[];
  upvotes: number;
  answer_count: number;
  created_at: string;
  updated_at: string;
  profiles: QuestionAuthor | null;
}

export interface Answer {
  id: string;
  question_id: string;
  author_id: string;
  body: string;
  upvotes: number;
  is_accepted: boolean;
  created_at: string;
  updated_at: string;
  profiles: QuestionAuthor | null;
}

const fetchAuthors = async (ids: string[]) => {
  if (!ids.length) return new Map<string, QuestionAuthor>();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, job_title, company, avatar_url, profile_type, is_verified_recruiter")
    .in("id", ids);
  if (error) throw error;
  return new Map((data ?? []).map((p) => [p.id, p as QuestionAuthor]));
};

export const useQuestions = (sort: QuestionSort = "new", search = "") => {
  return useQuery({
    queryKey: ["questions", sort, search],
    queryFn: async (): Promise<Question[]> => {
      let query = supabase.from("questions").select("*");
      if (search.trim()) {
        query = query.ilike("title", `%${search.trim()}%`);
      }
      if (sort === "top") query = query.order("upvotes", { ascending: false }).order("created_at", { ascending: false });
      else if (sort === "unanswered") query = query.eq("answer_count", 0).order("created_at", { ascending: false });
      else query = query.order("created_at", { ascending: false });

      const { data, error } = await query.limit(100);
      if (error) throw error;
      const rows = (data ?? []) as any[];
      const authors = await fetchAuthors(rows.map((r) => r.author_id));
      return rows.map((r) => ({ ...r, profiles: authors.get(r.author_id) ?? null }));
    },
  });
};

export const useQuestion = (id: string | undefined) => {
  return useQuery({
    queryKey: ["question", id],
    enabled: !!id,
    queryFn: async (): Promise<Question | null> => {
      const { data, error } = await supabase.from("questions").select("*").eq("id", id!).maybeSingle();
      if (error) throw error;
      if (!data) return null;
      const authors = await fetchAuthors([data.author_id]);
      return { ...(data as any), profiles: authors.get(data.author_id) ?? null };
    },
  });
};

export const useAnswers = (questionId: string | undefined) => {
  return useQuery({
    queryKey: ["question-answers", questionId],
    enabled: !!questionId,
    queryFn: async (): Promise<Answer[]> => {
      const { data, error } = await supabase
        .from("question_answers")
        .select("*")
        .eq("question_id", questionId!)
        .order("is_accepted", { ascending: false })
        .order("upvotes", { ascending: false })
        .order("created_at", { ascending: true });
      if (error) throw error;
      const rows = (data ?? []) as any[];
      const authors = await fetchAuthors(rows.map((r) => r.author_id));
      return rows.map((r) => ({ ...r, profiles: authors.get(r.author_id) ?? null }));
    },
  });
};

export const useCreateQuestion = () => {
  const { toast } = useToast();
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({ title, body, tags }: { title: string; body: string; tags: string[] }) => {
      if (!user) throw new Error("Not authenticated");
      const { data, error } = await supabase
        .from("questions")
        .insert({ author_id: user.id, title: title.trim(), body: body.trim(), tags })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({ title: "Question posted" });
      qc.invalidateQueries({ queryKey: ["questions"] });
    },
    onError: (e: any) => toast({ title: "Failed to post question", description: e.message, variant: "destructive" }),
  });
};

export const useCreateAnswer = () => {
  const { toast } = useToast();
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({ questionId, body }: { questionId: string; body: string }) => {
      if (!user) throw new Error("Not authenticated");
      const { data, error } = await supabase
        .from("question_answers")
        .insert({ question_id: questionId, author_id: user.id, body: body.trim() })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_d, v) => {
      toast({ title: "Answer posted" });
      qc.invalidateQueries({ queryKey: ["question-answers", v.questionId] });
      qc.invalidateQueries({ queryKey: ["question", v.questionId] });
      qc.invalidateQueries({ queryKey: ["questions"] });
    },
    onError: (e: any) => toast({ title: "Failed to post answer", description: e.message, variant: "destructive" }),
  });
};

export const useDeleteQuestion = () => {
  const { toast } = useToast();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("questions").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Question deleted" });
      qc.invalidateQueries({ queryKey: ["questions"] });
    },
  });
};

export const useDeleteAnswer = () => {
  const { toast } = useToast();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, questionId }: { id: string; questionId: string }) => {
      const { error } = await supabase.from("question_answers").delete().eq("id", id);
      if (error) throw error;
      return { questionId };
    },
    onSuccess: ({ questionId }) => {
      toast({ title: "Answer deleted" });
      qc.invalidateQueries({ queryKey: ["question-answers", questionId] });
      qc.invalidateQueries({ queryKey: ["question", questionId] });
    },
  });
};

export const useAcceptAnswer = () => {
  const { toast } = useToast();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ answerId, questionId, accepted }: { answerId: string; questionId: string; accepted: boolean }) => {
      if (accepted) {
        // Clear existing accepted answers for this question first
        await supabase.from("question_answers").update({ is_accepted: false }).eq("question_id", questionId);
      }
      const { error } = await supabase.from("question_answers").update({ is_accepted: accepted }).eq("id", answerId);
      if (error) throw error;
      return { questionId };
    },
    onSuccess: ({ questionId }) => {
      qc.invalidateQueries({ queryKey: ["question-answers", questionId] });
    },
    onError: (e: any) => toast({ title: "Could not update answer", description: e.message, variant: "destructive" }),
  });
};

// Votes
export const useMyQuestionVotes = (questionIds: string[]) => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["question-votes", "questions", user?.id, questionIds.sort().join(",")],
    enabled: !!user && questionIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("question_votes")
        .select("question_id, value")
        .eq("user_id", user!.id)
        .in("question_id", questionIds);
      if (error) throw error;
      const map = new Map<string, number>();
      (data ?? []).forEach((v: any) => v.question_id && map.set(v.question_id, v.value));
      return map;
    },
  });
};

export const useMyAnswerVotes = (answerIds: string[]) => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["question-votes", "answers", user?.id, answerIds.sort().join(",")],
    enabled: !!user && answerIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("question_votes")
        .select("answer_id, value")
        .eq("user_id", user!.id)
        .in("answer_id", answerIds);
      if (error) throw error;
      const map = new Map<string, number>();
      (data ?? []).forEach((v: any) => v.answer_id && map.set(v.answer_id, v.value));
      return map;
    },
  });
};

export const useVote = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async ({
      questionId,
      answerId,
      value,
      current,
    }: {
      questionId?: string;
      answerId?: string;
      value: 1 | -1;
      current: number; // -1 | 0 | 1
    }) => {
      if (!user) throw new Error("Sign in to vote");
      const filterCol = questionId ? "question_id" : "answer_id";
      const targetId = questionId ?? answerId!;
      if (current === value) {
        // toggle off - delete
        const { error } = await supabase
          .from("question_votes")
          .delete()
          .eq("user_id", user.id)
          .eq(filterCol, targetId);
        if (error) throw error;
      } else if (current === 0) {
        const { error } = await supabase.from("question_votes").insert({
          user_id: user.id,
          question_id: questionId ?? null,
          answer_id: answerId ?? null,
          value,
        });
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("question_votes")
          .update({ value })
          .eq("user_id", user.id)
          .eq(filterCol, targetId);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["questions"] });
      qc.invalidateQueries({ queryKey: ["question"] });
      qc.invalidateQueries({ queryKey: ["question-answers"] });
      qc.invalidateQueries({ queryKey: ["question-votes"] });
    },
    onError: (e: any) => toast({ title: "Vote failed", description: e.message, variant: "destructive" }),
  });
};
