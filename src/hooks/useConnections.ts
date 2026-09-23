import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

const COOLDOWN_MINUTES = 10;

// Send a connection request
export const useSendConnectionRequest = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (recipientId: string) => {
      if (!user?.id) throw new Error("Not authenticated");
      if (recipientId === user.id) throw new Error("Cannot connect with yourself");

      // Fetch ALL existing connection records between these two users
      const { data: existingRecords } = await supabase
        .from("user_connections")
        .select("id, status, updated_at")
        .or(`and(requester_id.eq.${user.id},receiver_id.eq.${recipientId}),and(requester_id.eq.${recipientId},receiver_id.eq.${user.id})`);

      if (existingRecords && existingRecords.length > 0) {
        // If any record is already accepted, block
        if (existingRecords.some(r => r.status === "accepted")) {
          throw new Error("Already connected");
        }
        // If any record is pending, block
        if (existingRecords.some(r => r.status === "pending")) {
          throw new Error("Connection request already sent");
        }
        // All remaining must be rejected — check cooldown on the most recent one
        const mostRecent = existingRecords.sort((a, b) =>
          new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
        )[0];

        const rejectedAt = new Date(mostRecent.updated_at).getTime();
        const cooldownMs = COOLDOWN_MINUTES * 60 * 1000;
        if (Date.now() - rejectedAt < cooldownMs) {
          const remainingMs = cooldownMs - (Date.now() - rejectedAt);
          const remainingMin = Math.ceil(remainingMs / 60000);
          throw new Error(`Please wait ${remainingMin} minute${remainingMin !== 1 ? "s" : ""} before sending another request`);
        }

        // Cool-down passed — delete ALL old records between these users
        for (const record of existingRecords) {
          await supabase.from("user_connections").delete().eq("id", record.id);
        }
      }

      const { data: connection, error: connError } = await supabase
        .from("user_connections")
        .insert({
          requester_id: user.id,
          receiver_id: recipientId,
          status: "pending",
        })
        .select()
        .single();

      if (connError) throw connError;
      return connection;
    },
    onSuccess: async (connection, recipientId) => {
      // DB trigger (create_notification_for_connection_request) handles notification creation
      // Email sending would be handled separately by backend service
      // checking email_preferences table for user settings
      
      qc.invalidateQueries({ queryKey: ["connections"] });
      qc.invalidateQueries({ queryKey: ["connection-status"] });
      qc.invalidateQueries({ queryKey: ["connection-count"] });
      toast({
        title: "Connection request sent",
        description: "Your request has been sent successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to send request",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

// Accept a connection request
export const useAcceptConnectionRequest = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (connectionId: string) => {
      if (!user?.id) throw new Error("Not authenticated");

      const { data: connection, error: updateError } = await supabase
        .from("user_connections")
        .update({ status: "accepted" })
        .eq("id", connectionId)
        .eq("receiver_id", user.id)
        .select()
        .single();

      if (updateError) throw updateError;
      return connection;
    },
    onSuccess: async (connection) => {
      // DB trigger handles notification creation for connection acceptance
      // Email sending would be handled separately by backend service
      // checking email_preferences table
      
      qc.invalidateQueries({ queryKey: ["connections"] });
      qc.invalidateQueries({ queryKey: ["connection-status"] });
      qc.invalidateQueries({ queryKey: ["connection-count"] });
      qc.invalidateQueries({ queryKey: ["notifications"] });
      qc.invalidateQueries({ queryKey: ["pending-connections"] });
      toast({
        title: "Connection accepted",
        description: "You are now connected.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to accept request",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

// Reject a connection request
export const useRejectConnectionRequest = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (connectionId: string) => {
      if (!user?.id) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("user_connections")
        .update({ status: "rejected" })
        .eq("id", connectionId)
        .eq("receiver_id", user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["connections"] });
      qc.invalidateQueries({ queryKey: ["connection-status"] });
      qc.invalidateQueries({ queryKey: ["connection-count"] });
      qc.invalidateQueries({ queryKey: ["notifications"] });
      qc.invalidateQueries({ queryKey: ["pending-connections"] });
      toast({
        title: "Request rejected",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to reject request",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

// Get connection status between two users (includes receiver_id for accept logic)
export const useConnectionStatus = (otherUserId: string | null) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["connection-status", user?.id, otherUserId],
    enabled: !!user?.id && !!otherUserId && user.id !== otherUserId,
    queryFn: async (): Promise<{ id: string; status: string; requester_id: string; receiver_id: string; updated_at: string } | null> => {
      if (!user?.id || !otherUserId) return null;

      // Use limit(1) ordered by created_at desc instead of maybeSingle()
      // to handle potential duplicate records between the same user pair.
      // Prioritize accepted connections by ordering status (accepted < pending < rejected alphabetically works in our favor).
      const { data } = await supabase
        .from("user_connections")
        .select("id, status, requester_id, receiver_id, updated_at")
        .or(`and(requester_id.eq.${user.id},receiver_id.eq.${otherUserId}),and(requester_id.eq.${otherUserId},receiver_id.eq.${user.id})`)
        .order("created_at", { ascending: false });

      if (!data || data.length === 0) return null;

      // If there are multiple records, prefer accepted > pending > rejected
      const prioritized = data.find(d => d.status === "accepted")
        || data.find(d => d.status === "pending")
        || data[0];

      return prioritized as { id: string; status: string; requester_id: string; receiver_id: string; updated_at: string };
    },
  });
};

export interface ConnectionProfile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  job_title: string | null;
  connected_at: string | null;
}

// Get the accepted connections (as counterpart profiles) for any user id.
// Single source of truth for both the connection count and connection lists,
// so the two can never disagree.
export const useUserConnections = (userId: string | null) => {
  return useQuery({
    queryKey: ["connections", userId],
    enabled: !!userId,
    queryFn: async (): Promise<ConnectionProfile[]> => {
      if (!userId) return [];

      const { data: rows, error } = await supabase
        .from("user_connections")
        .select("id, requester_id, receiver_id, created_at")
        .eq("status", "accepted")
        .or(`requester_id.eq.${userId},receiver_id.eq.${userId}`)
        .order("created_at", { ascending: false });

      if (error) throw error;
      if (!rows || rows.length === 0) return [];

      // Unique counterpart ids, keeping the most recent connection date.
      const connectedAt = new Map<string, string | null>();
      for (const row of rows) {
        const counterpartId =
          row.requester_id === userId ? row.receiver_id : row.requester_id;
        if (!counterpartId || counterpartId === userId) continue;
        if (!connectedAt.has(counterpartId)) {
          connectedAt.set(counterpartId, row.created_at ?? null);
        }
      }

      const ids = Array.from(connectedAt.keys());
      if (ids.length === 0) return [];

      // Client-side join (project convention) to avoid PostgREST join issues.
      const { data: profiles, error: profileError } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url, job_title")
        .in("id", ids);

      if (profileError) throw profileError;

      const byId = new Map((profiles || []).map((p) => [p.id, p]));

      return ids.map((id) => {
        const profile = byId.get(id);
        return {
          id,
          full_name: profile?.full_name ?? null,
          avatar_url: profile?.avatar_url ?? null,
          job_title: profile?.job_title ?? null,
          connected_at: connectedAt.get(id) ?? null,
        };
      });
    },
  });
};

// Get connection count for a user (derived from the same data as the list)
export const useConnectionCount = (userId: string | null) => {
  const { data, ...rest } = useUserConnections(userId);
  return { ...rest, data: data?.length ?? 0 } as typeof rest & { data: number };
};

// Get all connections for the current user
export const useMyConnections = () => {
  const { user } = useAuth();
  return useUserConnections(user?.id ?? null);
};

// Get pending connection requests (received)
export const usePendingConnectionRequests = () => {
  const { user } = useAuth();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["pending-connections", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from("user_connections")
        .select(`
          id,
          requester_id,
          created_at,
          requester:profiles!user_connections_requester_id_fkey(full_name, avatar_url, job_title)
        `)
        .eq("receiver_id", user.id)
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });

  // Real-time subscription for new pending connection requests
  useEffect(() => {
    if (!user?.id) return;

    const subscription = supabase
      .channel("pending-connections")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "user_connections",
          filter: `receiver_id=eq.${user.id}`,
        },
        () => {
          qc.invalidateQueries({ queryKey: ["pending-connections", user.id] });
          qc.invalidateQueries({ queryKey: ["connection-status"] });
          qc.invalidateQueries({ queryKey: ["connection-count"] });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "user_connections",
          filter: `receiver_id=eq.${user.id}`,
        },
        () => {
          qc.invalidateQueries({ queryKey: ["pending-connections", user.id] });
          qc.invalidateQueries({ queryKey: ["connection-status"] });
          qc.invalidateQueries({ queryKey: ["connection-count"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [user?.id, qc]);

  return query;
};
