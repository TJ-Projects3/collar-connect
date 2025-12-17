import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

export type Event = Tables<"events">;

export const useAdminEvents = () => {
  return useQuery({
    queryKey: ["admin-events"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .order("start_time", { ascending: false });

      if (error) throw error;
      return data as Event[];
    },
  });
};

export const useCreateEvent = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (event: TablesInsert<"events">) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("events")
        .insert({ ...event, created_by: user.id })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({ title: "Event created successfully!" });
      queryClient.invalidateQueries({ queryKey: ["admin-events"] });
      queryClient.invalidateQueries({ queryKey: ["events"] });
    },
    onError: (error) => {
      toast({ title: "Failed to create event", description: error.message, variant: "destructive" });
    },
  });
};

export const useUpdateEvent = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...event }: TablesUpdate<"events"> & { id: string }) => {
      const { data, error } = await supabase
        .from("events")
        .update(event)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({ title: "Event updated successfully!" });
      queryClient.invalidateQueries({ queryKey: ["admin-events"] });
      queryClient.invalidateQueries({ queryKey: ["events"] });
    },
    onError: (error) => {
      toast({ title: "Failed to update event", description: error.message, variant: "destructive" });
    },
  });
};

export const useDeleteEvent = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("events").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Event deleted successfully!" });
      queryClient.invalidateQueries({ queryKey: ["admin-events"] });
      queryClient.invalidateQueries({ queryKey: ["events"] });
    },
    onError: (error) => {
      toast({ title: "Failed to delete event", description: error.message, variant: "destructive" });
    },
  });
};
