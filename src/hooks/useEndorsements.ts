import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import type { Tables } from "@/integrations/supabase/types";

export type Endorsement = Tables<"student_endorsements">;

export interface EndorsementWithMeta extends Endorsement {
  student?: { id: string; full_name: string | null; avatar_url: string | null } | null;
  project?: { id: string; title: string } | null;
}

export const DEFAULT_BADGE_TITLES = [
  "NextGen Outstanding Intern",
  "Lead Developer",
  "NextGen Rising Star",
  "Community Leader",
  "Hackathon Champion",
  "Mentor of the Year",
];

export interface EndorsementInput {
  student_id: string;
  badge_title: string;
  description?: string | null;
  project_id?: string | null;
}

/** Endorsements for one student (used on profile + project cards). */
export const useStudentEndorsements = (studentId: string | null | undefined) => {
  return useQuery({
    queryKey: ["student-endorsements", studentId],
    queryFn: async () => {
      if (!studentId) return [] as Endorsement[];
      const { data, error } = await supabase
        .from("student_endorsements")
        .select("*")
        .eq("student_id", studentId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as Endorsement[];
    },
    enabled: !!studentId,
  });
};

/** All endorsements, with student + project names resolved client-side. */
export const useAllEndorsements = () => {
  return useQuery({
    queryKey: ["all-endorsements"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("student_endorsements")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;

      const rows = (data || []) as Endorsement[];
      if (rows.length === 0) return [] as EndorsementWithMeta[];

      const studentIds = Array.from(new Set(rows.map((r) => r.student_id)));
      const projectIds = Array.from(
        new Set(rows.map((r) => r.project_id).filter(Boolean) as string[])
      );

      const [{ data: profiles }, projectsRes] = await Promise.all([
        supabase.from("profiles").select("id, full_name, avatar_url").in("id", studentIds),
        projectIds.length > 0
          ? supabase.from("student_projects").select("id, title").in("id", projectIds)
          : Promise.resolve({ data: [] as { id: string; title: string }[] }),
      ]);

      const profileMap = new Map((profiles || []).map((p: any) => [p.id, p]));
      const projectMap = new Map(((projectsRes as any).data || []).map((p: any) => [p.id, p]));

      return rows.map((r) => ({
        ...r,
        student: profileMap.get(r.student_id) ?? null,
        project: r.project_id ? projectMap.get(r.project_id) ?? null : null,
      })) as EndorsementWithMeta[];
    },
  });
};

/** Distinct badge titles already used, merged with the defaults. */
export const useBadgeTitles = () => {
  const { data: endorsements } = useAllEndorsements();
  const used = (endorsements || []).map((e) => e.badge_title);
  return Array.from(new Set([...DEFAULT_BADGE_TITLES, ...used])).sort((a, b) =>
    a.localeCompare(b)
  );
};

/** Students available to endorse. */
export const useStudentDirectory = () => {
  return useQuery({
    queryKey: ["student-directory"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url, university, profile_type")
        .eq("profile_type", "student")
        .order("full_name", { ascending: true });
      if (error) throw error;
      return (data || []) as {
        id: string;
        full_name: string | null;
        avatar_url: string | null;
        university: string | null;
      }[];
    },
  });
};

const invalidate = (qc: ReturnType<typeof useQueryClient>, studentId?: string) => {
  qc.invalidateQueries({ queryKey: ["all-endorsements"] });
  qc.invalidateQueries({ queryKey: ["talent-candidates"] });
  if (studentId) qc.invalidateQueries({ queryKey: ["student-endorsements", studentId] });
  else qc.invalidateQueries({ queryKey: ["student-endorsements"] });
};

export const useSaveEndorsement = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, input }: { id?: string; input: EndorsementInput }) => {
      const payload = {
        student_id: input.student_id,
        badge_title: input.badge_title.trim(),
        description: input.description?.trim() || null,
        project_id: input.project_id || null,
      };

      if (id) {
        const { data, error } = await supabase
          .from("student_endorsements")
          .update(payload)
          .eq("id", id)
          .select()
          .single();
        if (error) throw error;
        return data as Endorsement;
      }

      const { data, error } = await supabase
        .from("student_endorsements")
        .insert({ ...payload, issued_by: user?.id ?? null })
        .select()
        .single();
      if (error) throw error;
      return data as Endorsement;
    },
    onSuccess: (data) => {
      invalidate(qc, data.student_id);
      toast({ title: "Endorsement saved", description: "The official badge is now live." });
    },
    onError: (error: any) => {
      toast({
        title: "Could not save endorsement",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

export const useDeleteEndorsement = () => {
  const { toast } = useToast();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (endorsement: Endorsement) => {
      const { error } = await supabase
        .from("student_endorsements")
        .delete()
        .eq("id", endorsement.id);
      if (error) throw error;
      return endorsement;
    },
    onSuccess: (endorsement) => {
      invalidate(qc, endorsement.student_id);
      toast({ title: "Endorsement removed" });
    },
    onError: (error: any) => {
      toast({
        title: "Could not remove endorsement",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};
