import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface EmailPreferences {
  id: string;
  user_id: string;
  email_on_message: boolean;
  email_on_connection_request: boolean;
  email_on_connection_accepted: boolean;
  email_digest: boolean;
  digest_frequency: string;
  created_at: string;
  updated_at: string;
}

// Fetch user's email preferences
export const useEmailPreferences = () => {
  const { user } = useAuth();

  const query = useQuery({
    queryKey: ["email-preferences", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      try {
        const { data, error } = await (supabase as any)
          .from("email_preferences")
          .select("*")
          .eq("user_id", user!.id)
          .maybeSingle();

        if (error) throw error;

        // If no preferences exist, return defaults
        if (!data) {
          return {
            id: "",
            user_id: user!.id,
            email_on_message: true,
            email_on_connection_request: true,
            email_on_connection_accepted: true,
            email_digest: false,
            digest_frequency: "daily",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          } as EmailPreferences;
        }

        return data as EmailPreferences;
      } catch (error) {
        console.error("Error fetching email preferences:", error);
        // Return defaults if error
        return {
          id: "",
          user_id: user!.id,
          email_on_message: true,
          email_on_connection_request: true,
          email_on_connection_accepted: true,
          email_digest: false,
          digest_frequency: "daily",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        } as EmailPreferences;
      }
    },
  });

  return query;
};

// Update email preferences
export const useUpdateEmailPreferences = () => {
  const { user } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (prefs: Partial<EmailPreferences>) => {
      if (!user?.id) throw new Error("User not authenticated");

      const { data, error } = await (supabase as any)
        .from("email_preferences")
        .upsert(
          {
            user_id: user.id,
            ...prefs,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id" }
        )
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["email-preferences", user?.id] });
    },
  });
};

// Fetch email logs for debugging/transparency
export const useEmailLogs = () => {
  const { user } = useAuth();

  const query = useQuery({
    queryKey: ["email-logs", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      try {
        const { data, error } = await (supabase as any)
          .from("email_logs")
          .select("*")
          .eq("user_id", user!.id)
          .order("created_at", { ascending: false })
          .limit(50);

        if (error) throw error;
        return data || [];
      } catch (error) {
        console.error("Error fetching email logs:", error);
        return [];
      }
    },
  });

  return query;
};
