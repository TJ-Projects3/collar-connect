import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

export interface BlockedUserRow {
  id: string;
  blocked_id: string;
  created_at: string;
  profile: {
    id: string;
    full_name: string | null;
    job_title: string | null;
    avatar_url: string | null;
  } | null;
}

/**
 * Fetches every user id that is blocked in either direction for the current user.
 * Used by content queries so blocked people disappear immediately.
 */
export const fetchBlockedIds = async (): Promise<Set<string>> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Set();

  const { data, error } = await supabase
    .from("blocked_users")
    .select("blocker_id, blocked_id")
    .or(`blocker_id.eq.${user.id},blocked_id.eq.${user.id}`);

  if (error) {
    console.error("Failed to load blocked users", error);
    return new Set();
  }

  const ids = new Set<string>();
  (data ?? []).forEach((row) => {
    if (row.blocker_id !== user.id) ids.add(row.blocker_id);
    if (row.blocked_id !== user.id) ids.add(row.blocked_id);
  });
  return ids;
};

export const useBlockedIds = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["blocked-ids", user?.id],
    enabled: !!user,
    queryFn: fetchBlockedIds,
  });
};

export const useBlockedUsers = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["blocked-users", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<BlockedUserRow[]> => {
      const { data, error } = await supabase
        .from("blocked_users")
        .select("id, blocked_id, created_at")
        .eq("blocker_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;

      const rows = data ?? [];
      if (rows.length === 0) return [];

      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, job_title, avatar_url")
        .in("id", rows.map((r) => r.blocked_id));

      const map = new Map((profiles ?? []).map((p) => [p.id, p]));
      return rows.map((r) => ({ ...r, profile: map.get(r.blocked_id) ?? null }));
    },
  });
};

const invalidateContent = (queryClient: ReturnType<typeof useQueryClient>) => {
  ["blocked-ids", "blocked-users", "posts", "post-replies", "questions", "question-answers", "connections", "talent-candidates", "all-profiles"]
    .forEach((key) => queryClient.invalidateQueries({ queryKey: [key] }));
};

export const useBlockUser = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (blockedId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      if (user.id === blockedId) throw new Error("You cannot block yourself");

      const { error } = await supabase
        .from("blocked_users")
        .upsert({ blocker_id: user.id, blocked_id: blockedId }, { onConflict: "blocker_id,blocked_id" });
      if (error) throw error;
    },
    onSuccess: () => {
      invalidateContent(queryClient);
      toast({
        title: "User blocked",
        description: "You will no longer see their content or receive messages from them.",
      });
    },
    onError: (error: Error) => {
      toast({ title: "Could not block user", description: error.message, variant: "destructive" });
    },
  });
};

export const useUnblockUser = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (blockedId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("blocked_users")
        .delete()
        .eq("blocker_id", user.id)
        .eq("blocked_id", blockedId);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidateContent(queryClient);
      toast({ title: "User unblocked" });
    },
    onError: (error: Error) => {
      toast({ title: "Could not unblock user", description: error.message, variant: "destructive" });
    },
  });
};
