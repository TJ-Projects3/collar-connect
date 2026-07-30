import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { CareerResults } from "@/lib/career-scoring";

export interface CareerRoadmap {
  summary: string;
  phases: { title: string; timeframe: string; focus: string; actions: string[] }[];
  skills: string[];
  projects: { title: string; description: string }[];
  certifications: string[];
  roles: string[];
}

export const useGenerateRoadmap = () =>
  useMutation({
    mutationFn: async (results: CareerResults): Promise<CareerRoadmap> => {
      const { data, error } = await supabase.functions.invoke("career-roadmap", {
        body: {
          primaryTrack: results.tracks[0]?.name,
          secondaryTrack: results.tracks[1]?.name,
          readiness: results.readiness,
          trackScores: results.tracks.map((t) => ({
            name: t.name,
            percentage: t.percentage,
          })),
        },
      });

      if (error) {
        const status = (error as { context?: { status?: number } }).context?.status;
        if (status === 429) {
          throw new Error("Too many requests right now — please try again in a minute.");
        }
        if (status === 402) {
          throw new Error("AI credits exhausted. Add credits in Settings to continue.");
        }
        throw new Error(error.message || "Failed to generate roadmap.");
      }

      return data as CareerRoadmap;
    },
  });
