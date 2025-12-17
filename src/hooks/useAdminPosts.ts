import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const useAdminPosts = () => {
  return useQuery({
    queryKey: ["admin-posts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("posts")
        .select(`
          *,
          profiles:author_id (
            full_name,
            avatar_url
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });
};

export const useDeletePost = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("posts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Post deleted successfully!" });
      queryClient.invalidateQueries({ queryKey: ["admin-posts"] });
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
    onError: (error) => {
      toast({ title: "Failed to delete post", description: error.message, variant: "destructive" });
    },
  });
};
