import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useMyConnections } from "@/hooks/useConnections";

export interface MentionCandidate {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  job_title: string | null;
  isConnection: boolean;
}

/** Debounce a changing value so we don't query on every keystroke. */
const useDebounced = <T,>(value: T, delay = 200) => {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(t);
  }, [value, delay]);
  return debounced;
};

/**
 * Searches profiles by name for the @mention autocomplete.
 * Connections are returned first, then everyone else.
 */
export const useMentionSearch = (term: string | null) => {
  const { user } = useAuth();
  const debouncedTerm = useDebounced(term ?? "", 180);
  const { data: connections = [] } = useMyConnections();

  const connectionIds = new Set<string>();
  for (const c of connections as any[]) {
    const otherId = c.requester_id === user?.id ? c.receiver_id : c.requester_id;
    if (otherId) connectionIds.add(otherId);
  }
  const connectionKey = Array.from(connectionIds).sort().join(",");

  return useQuery({
    queryKey: ["mention-search", debouncedTerm, connectionKey, user?.id],
    enabled: term !== null && !!user?.id,
    staleTime: 30_000,
    queryFn: async (): Promise<MentionCandidate[]> => {
      let query = supabase
        .from("profiles")
        .select("id, full_name, avatar_url, job_title, mentions_connections_only")
        .neq("id", user!.id)
        .not("full_name", "is", null)
        .limit(30);

      if (debouncedTerm.trim().length > 0) {
        query = query.ilike("full_name", `%${debouncedTerm.trim()}%`);
      }

      const { data, error } = await query;
      if (error) throw error;

      const rows = (data ?? [])
        .map((p) => ({
          ...p,
          isConnection: connectionIds.has(p.id),
        }))
        // Respect "only my connections can @mention me".
        .filter((p: any) => p.isConnection || !p.mentions_connections_only)
        .map(({ mentions_connections_only: _ignored, ...p }: any) => p) as MentionCandidate[];

      return rows
        .sort((a, b) => {
          if (a.isConnection !== b.isConnection) return a.isConnection ? -1 : 1;
          return (a.full_name || "").localeCompare(b.full_name || "");
        })
        .slice(0, 8);
    },
  });
};
