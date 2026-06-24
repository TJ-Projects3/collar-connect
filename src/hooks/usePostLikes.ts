import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

export type ReactionType = "like" | "insightful" | "celebrate" | "support";

export const REACTION_TYPES: ReactionType[] = ["like", "insightful", "celebrate", "support"];

// Hook to get reactions for a post
export const usePostLikes = (postId: string) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["post-likes", postId],
    queryFn: async () => {
      const { data: likesData, error } = await supabase
        .from("post_likes")
        .select("user_id, created_at, reaction_type")
        .eq("post_id", postId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const rows = (likesData || []) as Array<{
        user_id: string;
        created_at: string;
        reaction_type: string | null;
      }>;
      const userIds = Array.from(new Set(rows.map((r) => r.user_id)));
      let profilesById: Record<string, { full_name: string | null; avatar_url: string | null }> = {};

      if (userIds.length > 0) {
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("id, full_name, avatar_url")
          .in("id", userIds);
        profilesById = Object.fromEntries(
          (profilesData || []).map((p: any) => [p.id, { full_name: p.full_name, avatar_url: p.avatar_url }])
        );
      }

      const likes = rows.map((r) => ({
        user_id: r.user_id,
        created_at: r.created_at,
        reaction_type: ((r.reaction_type as ReactionType) || "like") as ReactionType,
        profile: profilesById[r.user_id] || null,
      }));

      const likeCount = likes.length;
      const userReaction: ReactionType | null = user
        ? likes.find((l) => l.user_id === user.id)?.reaction_type ?? null
        : null;
      const hasLiked = userReaction !== null;

      const breakdown: Record<ReactionType, number> = {
        like: 0,
        insightful: 0,
        celebrate: 0,
        support: 0,
      };
      likes.forEach((l) => {
        breakdown[l.reaction_type] = (breakdown[l.reaction_type] || 0) + 1;
      });

      return { likeCount, hasLiked, userReaction, likes, breakdown };
    },
  });
};

// Hook to set / change / remove a reaction
export const useToggleLike = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      postId,
      hasLiked,
      reaction,
      currentReaction,
    }: {
      postId: string;
      hasLiked: boolean;
      reaction?: ReactionType;
      currentReaction?: ReactionType | null;
    }) => {
      if (!user) throw new Error("Not authenticated");

      const target: ReactionType = reaction ?? "like";

      // If user already has this exact reaction → remove it (toggle off)
      if (hasLiked && (currentReaction ?? "like") === target) {
        const { error } = await supabase
          .from("post_likes")
          .delete()
          .eq("post_id", postId)
          .eq("user_id", user.id);
        if (error) throw error;
        return { postId, removed: true };
      }

      // Upsert reaction (insert new or update existing to a different type)
      const { error } = await supabase
        .from("post_likes")
        .upsert(
          { post_id: postId, user_id: user.id, reaction_type: target },
          { onConflict: "post_id,user_id" }
        );
      if (error) throw error;

      return { postId, removed: false, reaction: target };
    },
    onSuccess: ({ postId }) => {
      queryClient.invalidateQueries({ queryKey: ["post-likes", postId] });
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update reaction",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};
