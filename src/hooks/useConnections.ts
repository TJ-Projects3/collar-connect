import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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

      // Check if connection already exists
      const { data: existing } = await supabase
        .from("connections" as any)
        .select("id, status")
        .or(`and(requester_id.eq.${user.id},recipient_id.eq.${recipientId}),and(requester_id.eq.${recipientId},recipient_id.eq.${user.id})`)
        .maybeSingle();

      if (existing) {
        throw new Error(
          (existing as any).status === "pending"
            ? "Connection request already sent"
            : "Already connected"
        );
      }

      // Get user's profile for the notification
      const { data: userProfile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .single();

      // Create connection request
      const { data: connection, error: connError } = await supabase
        .from("connections" as any)
        .insert({
          requester_id: user.id,
          recipient_id: recipientId,
          status: "pending",
        })
        .select()
        .single();

      if (connError) throw connError;

      // Create notification for recipient
      const { error: notifError } = await supabase
        .from("notifications" as any)
        .insert({
          user_id: recipientId,
          type: "connection_request",
          title: "New Connection Request",
          body: `${userProfile?.full_name || "Someone"} wants to connect with you`,
          reference_id: (connection as any).id,
        });

      if (notifError) console.error("Failed to create notification:", notifError);

      return connection;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["connections"] });
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

      // Update connection status
      const { data: connection, error: updateError } = await supabase
        .from("connections" as any)
        .update({ status: "accepted" })
        .eq("id", connectionId)
        .eq("recipient_id", user.id) // Ensure only recipient can accept
        .select()
        .single();

      if (updateError) throw updateError;

      // Get recipient's profile for the notification
      const { data: userProfile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .single();

      // Notify the requester that their request was accepted
      const { error: notifError } = await supabase
        .from("notifications" as any)
        .insert({
          user_id: (connection as any).requester_id,
          type: "connection_accepted",
          title: "Connection Request Accepted",
          body: `${userProfile?.full_name || "Someone"} accepted your connection request`,
          reference_id: connectionId,
        });

      if (notifError) console.error("Failed to create notification:", notifError);

      return connection;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["connections"] });
      qc.invalidateQueries({ queryKey: ["notifications"] });
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
        .from("connections" as any)
        .update({ status: "rejected" })
        .eq("id", connectionId)
        .eq("recipient_id", user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["connections"] });
      qc.invalidateQueries({ queryKey: ["notifications"] });
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

// Get connection status between two users
export const useConnectionStatus = (otherUserId: string | null) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["connection-status", user?.id, otherUserId],
    enabled: !!user?.id && !!otherUserId && user.id !== otherUserId,
    queryFn: async () => {
      if (!user?.id || !otherUserId) return null;

      const { data } = await supabase
        .from("connections" as any)
        .select("id, status, requester_id")
        .or(`and(requester_id.eq.${user.id},recipient_id.eq.${otherUserId}),and(requester_id.eq.${otherUserId},recipient_id.eq.${user.id})`)
        .maybeSingle();

      return data;
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
        .from("connections" as any)
        .select(`
          id,
          requester_id,
          recipient_id,
          status,
          created_at,
          requester:requester_id(full_name, avatar_url),
          recipient:recipient_id(full_name, avatar_url)
        `)
        .or(`requester_id.eq.${user.id},recipient_id.eq.${user.id}`)
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

  return useQuery({
    queryKey: ["pending-connections", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from("connections" as any)
        .select(`
          id,
          requester_id,
          created_at,
          requester:requester_id(full_name, avatar_url, job_title)
        `)
        .eq("recipient_id", user.id)
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });
};
