import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export type ReportTargetType = "post" | "reply" | "question" | "answer";
export type ReportReason = "spam" | "harassment" | "sexual" | "violence" | "misinformation" | "other";
export type ReportStatus = "open" | "reviewed" | "dismissed";

export const REPORT_REASONS: { value: ReportReason; label: string }[] = [
  { value: "spam", label: "Spam or scam" },
  { value: "harassment", label: "Harassment or hate" },
  { value: "sexual", label: "Sexual content" },
  { value: "violence", label: "Violence or threats" },
  { value: "misinformation", label: "Misinformation" },
  { value: "other", label: "Something else" },
];

export const TARGET_LABEL: Record<ReportTargetType, string> = {
  post: "post",
  reply: "comment",
  question: "question",
  answer: "answer",
};

export interface ContentReport {
  id: string;
  reporter_id: string;
  target_type: ReportTargetType;
  target_id: string;
  target_author_id: string | null;
  content_preview: string | null;
  reason: ReportReason;
  details: string | null;
  status: ReportStatus;
  created_at: string;
  reporter: { id: string; full_name: string | null; avatar_url: string | null } | null;
  author: { id: string; full_name: string | null; avatar_url: string | null } | null;
}

export const useSubmitReport = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      targetType,
      targetId,
      targetAuthorId,
      contentPreview,
      reason,
      details,
    }: {
      targetType: ReportTargetType;
      targetId: string;
      targetAuthorId?: string | null;
      contentPreview?: string | null;
      reason: ReportReason;
      details?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase.from("content_reports").insert({
        reporter_id: user.id,
        target_type: targetType,
        target_id: targetId,
        target_author_id: targetAuthorId ?? null,
        content_preview: contentPreview ? contentPreview.slice(0, 500) : null,
        reason,
        details: details?.trim() ? details.trim().slice(0, 2000) : null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["content-reports"] });
      toast({
        title: "Report submitted",
        description: "Thanks — our team will review this shortly.",
      });
    },
    onError: (error: Error) => {
      toast({ title: "Could not submit report", description: error.message, variant: "destructive" });
    },
  });
};

export const useContentReports = (status: ReportStatus | "all" = "open") => {
  return useQuery({
    queryKey: ["content-reports", status],
    queryFn: async (): Promise<ContentReport[]> => {
      let query = supabase.from("content_reports").select("*").order("created_at", { ascending: false });
      if (status !== "all") query = query.eq("status", status);

      const { data, error } = await query.limit(200);
      if (error) throw error;

      const rows = (data ?? []) as any[];
      if (rows.length === 0) return [];

      const ids = Array.from(
        new Set(rows.flatMap((r) => [r.reporter_id, r.target_author_id]).filter(Boolean))
      ) as string[];

      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url")
        .in("id", ids);
      const map = new Map((profiles ?? []).map((p) => [p.id, p]));

      return rows.map((r) => ({
        ...r,
        reporter: map.get(r.reporter_id) ?? null,
        author: r.target_author_id ? map.get(r.target_author_id) ?? null : null,
      }));
    },
  });
};

const TARGET_TABLE: Record<ReportTargetType, "posts" | "post_replies" | "questions" | "question_answers"> = {
  post: "posts",
  reply: "post_replies",
  question: "questions",
  answer: "question_answers",
};

export const useResolveReport = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      report,
      action,
    }: {
      report: ContentReport;
      action: "dismiss" | "remove";
    }) => {
      if (action === "remove") {
        const { error: deleteError } = await supabase
          .from(TARGET_TABLE[report.target_type])
          .delete()
          .eq("id", report.target_id);
        if (deleteError) throw deleteError;
      }

      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase
        .from("content_reports")
        .update({
          status: action === "remove" ? "reviewed" : "dismissed",
          reviewed_by: user?.id ?? null,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", report.id);
      if (error) throw error;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["content-reports"] });
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      queryClient.invalidateQueries({ queryKey: ["post-replies"] });
      queryClient.invalidateQueries({ queryKey: ["questions"] });
      queryClient.invalidateQueries({ queryKey: ["question-answers"] });
      toast({
        title: variables.action === "remove" ? "Content removed" : "Report dismissed",
      });
    },
    onError: (error: Error) => {
      toast({ title: "Action failed", description: error.message, variant: "destructive" });
    },
  });
};
