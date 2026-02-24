import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

// Send a connection request
export const useSendConnectionRequest = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (recipientId: string) => {
      if (!user?.id) throw new Error("Not authenticated");
      if (recipientId === user.id) throw new Error("Cannot connect with yourself");

      const { data: existing } = await supabase
        .from("user_connections")
        .select("id, status")
        .or(`and(requester_id.eq.${user.id},receiver_id.eq.${recipientId}),and(requester_id.eq.${recipientId},receiver_id.eq.${user.id})`)
        .maybeSingle();

      if (existing) {
        throw new Error(
          existing.status === "pending"
            ? "Connection request already sent"
            : "Already connected"
        );
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
    queryFn: async (): Promise<{ id: string; status: string; requester_id: string; receiver_id: string } | null> => {
      if (!user?.id || !otherUserId) return null;

      const { data } = await supabase
        .from("user_connections")
        .select("id, status, requester_id, receiver_id")
        .or(`and(requester_id.eq.${user.id},receiver_id.eq.${otherUserId}),and(requester_id.eq.${otherUserId},receiver_id.eq.${user.id})`)
        .maybeSingle();

      return data as { id: string; status: string; requester_id: string; receiver_id: string } | null;
    },
  });
};

// Get connection count for a user
export const useConnectionCount = (userId: string | null) => {
  return useQuery({
    queryKey: ["connection-count", userId],
    enabled: !!userId,
    queryFn: async () => {
      if (!userId) return 0;

      const { count, error } = await supabase
        .from("user_connections")
        .select("*", { count: "exact", head: true })
        .or(`requester_id.eq.${userId},receiver_id.eq.${userId}`)
        .eq("status", "accepted");

      if (error) throw error;
      return count || 0;
    },
  });
};

// Get all connections for the current user
export const useMyConnections = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["connections", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from("user_connections")
        .select(`
          id,
          requester_id,
          receiver_id,
          status,
          created_at,
          requester:profiles!user_connections_requester_id_fkey(id, full_name, avatar_url, job_title),
          receiver:profiles!user_connections_receiver_id_fkey(id, full_name, avatar_url, job_title)
        `)
        .or(`requester_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .eq("status", "accepted")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });
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
