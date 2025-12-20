import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

// Hook to share a post
export const useSharePost = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ postId, sharedWith }: { postId: string; sharedWith?: string }) => {
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("post_shares" as any)
        .insert({
          post_id: postId,
          shared_by: user.id,
          shared_with: sharedWith || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({ title: "Post shared successfully!" });
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to share post",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

// Hook to copy post link to clipboard
export const useCopyPostLink = () => {
  const { toast } = useToast();

  return {
    copyLink: (postId: string) => {
      const postUrl = `${window.location.origin}/feed?post=${postId}`;
      
      navigator.clipboard.writeText(postUrl).then(
        () => {
          toast({ title: "Link copied to clipboard!" });
        },
        (err) => {
          toast({
            title: "Failed to copy link",
            description: err.message,
            variant: "destructive",
          });
        }
      );
    },
  };
};
