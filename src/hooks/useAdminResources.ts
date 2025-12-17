import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

export type Resource = Tables<"resources">;

export const useAdminResources = () => {
  return useQuery({
    queryKey: ["admin-resources"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("resources")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Resource[];
    },
  });
};

export const useCreateResource = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (resource: TablesInsert<"resources">) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("resources")
        .insert({ ...resource, created_by: user.id })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({ title: "Resource created successfully!" });
      queryClient.invalidateQueries({ queryKey: ["admin-resources"] });
      queryClient.invalidateQueries({ queryKey: ["resources"] });
    },
    onError: (error) => {
      toast({ title: "Failed to create resource", description: error.message, variant: "destructive" });
    },
  });
};

export const useUpdateResource = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...resource }: TablesUpdate<"resources"> & { id: string }) => {
      const { data, error } = await supabase
        .from("resources")
        .update(resource)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({ title: "Resource updated successfully!" });
      queryClient.invalidateQueries({ queryKey: ["admin-resources"] });
      queryClient.invalidateQueries({ queryKey: ["resources"] });
    },
    onError: (error) => {
      toast({ title: "Failed to update resource", description: error.message, variant: "destructive" });
    },
  });
};

export const useDeleteResource = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("resources").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Resource deleted successfully!" });
      queryClient.invalidateQueries({ queryKey: ["admin-resources"] });
      queryClient.invalidateQueries({ queryKey: ["resources"] });
    },
    onError: (error) => {
      toast({ title: "Failed to delete resource", description: error.message, variant: "destructive" });
    },
  });
};
