import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

// Hook to get replies for a post
export const usePostReplies = (postId: string) => {
  return useQuery({
    queryKey: ["post-replies", postId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("post_replies" as any)
        .select(`
          *,
          profiles:author_id (
            full_name,
            job_title,
            company,
            avatar_url
          )
        `)
        .eq("post_id", postId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data;
    },
  });
};

// Hook to create a reply
export const useCreateReply = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ postId, content }: { postId: string; content: string }) => {
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("post_replies" as any)
        .insert({
          post_id: postId,
          author_id: user.id,
          content,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      toast({ title: "Reply posted successfully!" });
      queryClient.invalidateQueries({ queryKey: ["post-replies", variables.postId] });
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to post reply",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

// Hook to delete a reply
export const useDeleteReply = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ replyId, postId }: { replyId: string; postId: string }) => {
      const { error } = await supabase
        .from("post_replies" as any)
        .delete()
        .eq("id", replyId);

      if (error) throw error;
      return { replyId, postId };
    },
    onSuccess: ({ postId }) => {
      toast({ title: "Reply deleted successfully!" });
      queryClient.invalidateQueries({ queryKey: ["post-replies", postId] });
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to delete reply",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};
