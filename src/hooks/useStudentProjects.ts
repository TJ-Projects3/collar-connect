import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import type { Tables } from "@/integrations/supabase/types";

export type StudentProject = Tables<"student_projects">;

export const useStudentProjects = (userId: string | null | undefined) => {
  return useQuery({
    queryKey: ["student-projects", userId],
    queryFn: async () => {
      if (!userId) return [] as StudentProject[];
      const { data, error } = await supabase
        .from("student_projects")
        .select("*")
        .eq("user_id", userId)
        .order("display_order", { ascending: true })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as StudentProject[];
    },
    enabled: !!userId,
  });
};

export interface ProjectInput {
  title: string;
  description?: string | null;
  cover_image_url?: string | null;
  tech_stack: string[];
  repo_url?: string | null;
  live_url?: string | null;
  achievement_label?: string | null;
}

const buildPostContent = (p: ProjectInput) => {
  const parts = [`🚀 New project: ${p.title}`];
  if (p.description) parts.push(p.description);
  if (p.tech_stack.length > 0) parts.push(`Built with: ${p.tech_stack.join(", ")}`);
  if (p.live_url) parts.push(`Live demo: ${p.live_url}`);
  if (p.repo_url) parts.push(`Code: ${p.repo_url}`);
  return parts.join("\n\n");
};

export const useCreateProject = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ project, shareToFeed }: { project: ProjectInput; shareToFeed: boolean }) => {
      if (!user?.id) throw new Error("Not authenticated");

      const { data: created, error } = await supabase
        .from("student_projects")
        .insert({
          user_id: user.id,
          title: project.title,
          description: project.description || null,
          cover_image_url: project.cover_image_url || null,
          tech_stack: project.tech_stack,
          repo_url: project.repo_url || null,
          live_url: project.live_url || null,
          achievement_label: project.achievement_label || null,
        })
        .select()
        .single();
      if (error) throw error;

      if (shareToFeed) {
        const { data: post, error: postError } = await supabase
          .from("posts")
          .insert({
            author_id: user.id,
            content: buildPostContent(project),
            project_id: created.id,
            media_url: project.cover_image_url || null,
            media_type: project.cover_image_url ? "image" : null,
          })
          .select("id")
          .single();
        if (postError) throw postError;

        await supabase
          .from("student_projects")
          .update({ shared_post_id: post.id })
          .eq("id", created.id);
      }

      return created as StudentProject;
    },
    onSuccess: (_data, vars) => {
      toast({
        title: "Project added",
        description: vars.shareToFeed ? "Shared to the community feed too." : undefined,
      });
      qc.invalidateQueries({ queryKey: ["student-projects", user?.id] });
      qc.invalidateQueries({ queryKey: ["posts"] });
    },
    onError: (error: any) => {
      toast({ title: "Failed to add project", description: error.message, variant: "destructive" });
    },
  });
};

export const useUpdateProject = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, project }: { id: string; project: ProjectInput }) => {
      const { data, error } = await supabase
        .from("student_projects")
        .update({
          title: project.title,
          description: project.description || null,
          cover_image_url: project.cover_image_url || null,
          tech_stack: project.tech_stack,
          repo_url: project.repo_url || null,
          live_url: project.live_url || null,
          achievement_label: project.achievement_label || null,
        })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data as StudentProject;
    },
    onSuccess: () => {
      toast({ title: "Project updated" });
      qc.invalidateQueries({ queryKey: ["student-projects", user?.id] });
      qc.invalidateQueries({ queryKey: ["posts"] });
    },
    onError: (error: any) => {
      toast({ title: "Failed to update project", description: error.message, variant: "destructive" });
    },
  });
};

export const useDeleteProject = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("student_projects").delete().eq("id", id);
      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      toast({ title: "Project deleted" });
      qc.invalidateQueries({ queryKey: ["student-projects", user?.id] });
      qc.invalidateQueries({ queryKey: ["posts"] });
    },
    onError: (error: any) => {
      toast({ title: "Failed to delete project", description: error.message, variant: "destructive" });
    },
  });
};

export const useShareProjectToFeed = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (project: StudentProject) => {
      if (!user?.id) throw new Error("Not authenticated");

      const { data: post, error } = await supabase
        .from("posts")
        .insert({
          author_id: user.id,
          content: buildPostContent({
            title: project.title,
            description: project.description,
            tech_stack: project.tech_stack || [],
            repo_url: project.repo_url,
            live_url: project.live_url,
          }),
          project_id: project.id,
          media_url: project.cover_image_url || null,
          media_type: project.cover_image_url ? "image" : null,
        })
        .select("id")
        .single();
      if (error) throw error;

      await supabase
        .from("student_projects")
        .update({ shared_post_id: post.id })
        .eq("id", project.id);

      return post.id;
    },
    onSuccess: () => {
      toast({ title: "Shared to feed", description: "Peers and recruiters can now give feedback." });
      qc.invalidateQueries({ queryKey: ["student-projects", user?.id] });
      qc.invalidateQueries({ queryKey: ["posts"] });
    },
    onError: (error: any) => {
      toast({ title: "Failed to share project", description: error.message, variant: "destructive" });
    },
  });
};

// Admin: projects awaiting achievement verification
export const useProjectAchievements = () => {
  return useQuery({
    queryKey: ["project-achievements"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("student_projects")
        .select("*")
        .not("achievement_label", "is", null)
        .order("created_at", { ascending: false });
      if (error) throw error;

      const rows = (data || []) as StudentProject[];
      const userIds = Array.from(new Set(rows.map((r) => r.user_id)));
      let profilesById: Record<string, { full_name: string | null; avatar_url: string | null }> = {};
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, full_name, avatar_url")
          .in("id", userIds);
        profilesById = Object.fromEntries(
          (profiles || []).map((p: any) => [p.id, { full_name: p.full_name, avatar_url: p.avatar_url }])
        );
      }
      return rows.map((r) => ({ ...r, profile: profilesById[r.user_id] || null }));
    },
  });
};

export const useSetProjectVerification = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, verified }: { id: string; verified: boolean }) => {
      const { error } = await supabase
        .from("student_projects")
        .update({
          achievement_verified: verified,
          verified_by: verified ? user?.id ?? null : null,
          verified_at: verified ? new Date().toISOString() : null,
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_d, vars) => {
      toast({ title: vars.verified ? "Achievement verified" : "Verification removed" });
      qc.invalidateQueries({ queryKey: ["project-achievements"] });
      qc.invalidateQueries({ queryKey: ["student-projects"] });
      qc.invalidateQueries({ queryKey: ["posts"] });
    },
    onError: (error: any) => {
      toast({ title: "Failed to update verification", description: error.message, variant: "destructive" });
    },
  });
};
