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
      const { data, error } = await supabase
        .from("post_likes" as any)
        .select("*")
        .eq("post_id", postId);

      if (error) throw error;

      const likeCount = data?.length || 0;
      const hasLiked = user ? data?.some((like: any) => like.user_id === user.id) : false;

      return { likeCount, hasLiked };
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
          .from("post_likes" as any)
          .delete()
          .eq("post_id", postId)
          .eq("user_id", user.id);

        if (error) throw error;
      } else {
        // Like the post
        const { error } = await supabase
          .from("post_likes" as any)
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
