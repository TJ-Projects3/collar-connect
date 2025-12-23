import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

// Hook to get replies for a post
export const usePostReplies = (postId: string) => {
  return useQuery({
    queryKey: ["post-replies", postId],
    queryFn: async () => {
      // First get the replies
      const { data: replies, error: repliesError } = await supabase
        .from("post_replies")
        .select("*")
        .eq("post_id", postId)
        .order("created_at", { ascending: true });

      if (repliesError) throw repliesError;
      if (!replies || replies.length === 0) return [];

      // Then get the profile data for each reply author
      const authorIds = replies
        .map(reply => reply.author_id)
        .filter((id): id is string => id !== null);

      if (authorIds.length === 0) return replies.map(reply => ({ ...reply, profiles: null }));

      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, full_name, job_title, company, avatar_url")
        .in("id", authorIds);

      if (profilesError) throw profilesError;

      // Combine the data
      const profilesMap = new Map(profiles?.map(p => [p.id, p]) || []);
      return replies.map(reply => ({
        ...reply,
        profiles: reply.author_id ? profilesMap.get(reply.author_id) || null : null
      }));
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
        .from("post_replies")
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
        .from("post_replies")
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
