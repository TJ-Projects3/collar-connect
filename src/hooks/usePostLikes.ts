import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

// Hook to get likes for a post
export const usePostLikes = (postId: string) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["post-likes", postId],
    queryFn: async () => {
      const { data: likesData, error } = await supabase
        .from("post_likes")
        .select("user_id, created_at")
        .eq("post_id", postId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const rows = likesData || [];
      const userIds = Array.from(new Set(rows.map((r: any) => r.user_id)));
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

      const likes = rows.map((r: any) => ({
        user_id: r.user_id,
        created_at: r.created_at,
        profile: profilesById[r.user_id] || null,
      }));

      const likeCount = likes.length;
      const hasLiked = user ? likes.some((like) => like.user_id === user.id) : false;

      return { likeCount, hasLiked, likes };
    },
  });
};

// Hook to toggle like on a post
export const useToggleLike = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ postId, hasLiked }: { postId: string; hasLiked: boolean }) => {
      if (!user) throw new Error("Not authenticated");

      if (hasLiked) {
        // Unlike the post
        const { error } = await supabase
          .from("post_likes")
          .delete()
          .eq("post_id", postId)
          .eq("user_id", user.id);

        if (error) throw error;
      } else {
        // Like the post
        const { error } = await supabase
          .from("post_likes")
          .insert({ post_id: postId, user_id: user.id });

        if (error) throw error;
      }

      return { postId, hasLiked: !hasLiked };
    },
    onSuccess: ({ postId }) => {
      queryClient.invalidateQueries({ queryKey: ["post-likes", postId] });
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update like",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};
