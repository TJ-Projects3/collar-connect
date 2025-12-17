import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Event {
  id: string;
  title: string;
  description: string | null;
  start_time: string;
  end_time: string;
  location: string | null;
  virtual_link: string | null;
  event_type: "virtual" | "in_person" | "hybrid";
  image_url: string | null;
  capacity: number | null;
  is_published: boolean;
}

export const useEvents = () => {
  return useQuery({
    queryKey: ["events"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .eq("is_published", true)
        .order("start_time", { ascending: true });

      if (error) throw error;
      return data as Event[];
    },
  });
};
