import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface Experience {
  id: string;
  user_id: string;
  title: string;
  company: string;
  description: string | null;
  start_date: string;
  end_date: string | null;
  is_current: boolean;
  location: string | null;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface ExperienceInput {
  title: string;
  company: string;
  description?: string | null;
  start_date: string;
  end_date?: string | null;
  is_current?: boolean;
  location?: string | null;
  display_order?: number;
}

export const useExperiences = (userId: string | null) => {
  return useQuery({
    queryKey: ["experiences", userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from("experiences")
        .select("*")
        .eq("user_id", userId)
        .order("start_date", { ascending: false });

      if (error) throw error;
      return data as Experience[];
    },
    enabled: !!userId,
  });
};

export const useAddExperience = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (input: ExperienceInput) => {
      if (!user?.id) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("experiences")
        .insert({
          user_id: user.id,
          title: input.title,
          company: input.company,
          description: input.description || null,
          start_date: input.start_date,
          end_date: input.is_current ? null : input.end_date || null,
          is_current: input.is_current || false,
          location: input.location || null,
          display_order: input.display_order || 0,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["experiences", user?.id] });
    },
  });
};

export const useUpdateExperience = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ id, ...input }: ExperienceInput & { id: string }) => {
      if (!user?.id) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("experiences")
        .update({
          title: input.title,
          company: input.company,
          description: input.description || null,
          start_date: input.start_date,
          end_date: input.is_current ? null : input.end_date || null,
          is_current: input.is_current || false,
          location: input.location || null,
          display_order: input.display_order,
        })
        .eq("id", id)
        .eq("user_id", user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["experiences", user?.id] });
    },
  });
};

export const useDeleteExperience = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!user?.id) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("experiences")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["experiences", user?.id] });
    },
  });
};
