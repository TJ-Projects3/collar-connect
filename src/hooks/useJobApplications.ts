import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import type { Tables } from "@/integrations/supabase/types";
import type { Job } from "@/hooks/useJobs";

export type JobApplicationStatus =
  | "saved"
  | "applied"
  | "interviewing"
  | "offered"
  | "rejected";

export type JobApplication = Tables<"job_applications">;

export type TrackedJob = JobApplication & { job: Job | null };

export const TRACKER_STATUSES: { value: JobApplicationStatus; label: string }[] = [
  { value: "saved", label: "Saved" },
  { value: "applied", label: "Applied" },
  { value: "interviewing", label: "Interviewing" },
  { value: "offered", label: "Offered" },
  { value: "rejected", label: "Rejected" },
];

export const useJobApplications = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["job-applications", user?.id],
    enabled: !!user?.id,
    queryFn: async (): Promise<TrackedJob[]> => {
      const { data, error } = await supabase
        .from("job_applications")
        .select("*")
        .order("updated_at", { ascending: false });
      if (error) throw error;

      const rows = (data ?? []) as JobApplication[];
      if (rows.length === 0) return [];

      // Client-side join keeps PostgREST embedding out of the picture.
      const { data: jobs, error: jobsError } = await supabase
        .from("jobs")
        .select("*")
        .in("id", rows.map((r) => r.job_id));
      if (jobsError) throw jobsError;

      const jobMap = new Map((jobs ?? []).map((j) => [j.id, j as Job]));
      return rows.map((r) => ({ ...r, job: jobMap.get(r.job_id) ?? null }));
    },
  });
};

export const useUpsertJobApplication = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      jobId,
      status,
      notes,
    }: {
      jobId: string;
      status: JobApplicationStatus;
      notes?: string | null;
    }) => {
      if (!user?.id) throw new Error("You must be signed in to track jobs");

      const payload: Record<string, unknown> = {
        user_id: user.id,
        job_id: jobId,
        status,
      };
      if (notes !== undefined) payload.notes = notes;
      if (status === "applied") payload.applied_at = new Date().toISOString();

      const { data, error } = await supabase
        .from("job_applications")
        .upsert(payload as never, { onConflict: "user_id,job_id" })
        .select()
        .single();
      if (error) throw error;
      return data as JobApplication;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["job-applications", user?.id] });
    },
    onError: (error: Error) => {
      toast({
        title: "Could not update tracker",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

export const useDeleteJobApplication = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (jobId: string) => {
      const { error } = await supabase
        .from("job_applications")
        .delete()
        .eq("job_id", jobId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["job-applications", user?.id] });
    },
    onError: (error: Error) => {
      toast({
        title: "Could not remove job",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};
