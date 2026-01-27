import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

// Types for better type safety
interface Message {
  id: string;
  conversation_id: string | null;
  sender_id: string;
  recipient_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
  updated_at: string;
}

interface Connection {
  id: string;
  user_id: string;
  connected_user_id: string;
  status: "pending" | "connected" | "rejected";
  created_at: string;
  updated_at: string;
}

interface ConversationData {
  counterpart_id: string;
  counterpart_profile: { full_name: string | null; avatar_url: string | null } | null;
  last_message: { content: string; created_at: string } | null;
}

// List conversations with last message time per counterpart
export const useConversations = () => {
  const { user } = useAuth();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["conversations", user?.id],
    enabled: !!user?.id,
    staleTime: 0,
    gcTime: 1000 * 60 * 5,
    refetchOnMount: "always",
    refetchOnWindowFocus: false,
    queryFn: async (): Promise<ConversationData[]> => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from("conversations")
        .select(`
          id,
          last_message,
          last_message_at,
          conversation_participants (
            user_id,
            user:user_id (full_name, avatar_url)
          )
        `)
        .order("last_message_at", { ascending: false });

      if (error) throw error;

      return (data as any[]).map((conv) => {
        const otherParticipant = conv.conversation_participants?.find(
          (p: any) => p.user_id !== user!.id
        );
        const counterpartProfile = otherParticipant?.user;
        const counterpartId = otherParticipant?.user_id;

        return {
          counterpart_id: counterpartId,
          counterpart_profile: counterpartProfile,
          last_message: conv.last_message
            ? { content: conv.last_message, created_at: conv.last_message_at }
            : null,
        };
      });
    },
  });

  // Real-time subscription for conversations
  useEffect(() => {
    if (!user?.id) return;

    const subscription = supabase
      .channel("conversations-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "conversations" },
        () => {
          qc.invalidateQueries({ queryKey: ["conversations", user.id] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [user?.id, qc]);

  return query;
};

// Fetch message history for a specific conversation
export const useConversationMessages = (recipientId: string | null) => {
  const { user } = useAuth();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["messages", user?.id, recipientId],
    enabled: !!user?.id && !!recipientId,
    staleTime: 0,
    queryFn: async (): Promise<Message[]> => {
      if (!user?.id || !recipientId) return [];

      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .or(
          `and(sender_id.eq.${user.id},recipient_id.eq.${recipientId}),and(sender_id.eq.${recipientId},recipient_id.eq.${user.id})`
        )
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data as Message[];
    },
  });

  // Real-time subscription for new messages
  useEffect(() => {
    if (!user?.id || !recipientId) return;

    const subscription = supabase
      .channel(`messages-${user.id}-${recipientId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          const newMessage = payload.new as Message;
          // Only process messages for this conversation
          if (
            (newMessage.sender_id === user.id && newMessage.recipient_id === recipientId) ||
            (newMessage.sender_id === recipientId && newMessage.recipient_id === user.id)
          ) {
            qc.setQueryData(
              ["messages", user.id, recipientId],
              (old: Message[] | undefined) => {
                if (!old) return [newMessage];
                // Avoid duplicates
                if (old.some((m) => m.id === newMessage.id)) return old;
                return [...old, newMessage];
              }
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [user?.id, recipientId, qc]);

  return query;
};

// List accepted connections for current user
export const useConnections = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["connections", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      if (!user?.id) return [];

      // Using 'as any' because user_connections table was just created
      // and types.ts hasn't been regenerated yet
      const { data, error } = await (supabase as any)
        .from("user_connections")
        .select(`
          id,
          user_id,
          connected_user_id,
          status,
          created_at,
          user:user_id (full_name, avatar_url),
          connected:connected_user_id (full_name, avatar_url)
        `)
        .or(`user_id.eq.${user.id},connected_user_id.eq.${user.id}`)
        .eq("status", "connected")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Normalize to show the other person
      return (data as any[]).map((c: any) => {
        const isInitiator = c.user_id === user.id;
        const otherProfile = isInitiator ? c.connected : c.user;
        const otherId = isInitiator ? c.connected_user_id : c.user_id;
        return {
          id: c.id,
          other_id: otherId,
          other_profile: otherProfile,
          status: c.status,
          created_at: c.created_at,
        };
      });
    },
  });
};

// Get connection status between current user and another user
export const useConnectionStatus = (otherUserId: string | null) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["connection-status", user?.id, otherUserId],
    enabled: !!user?.id && !!otherUserId && user.id !== otherUserId,
    queryFn: async (): Promise<Connection | null> => {
      if (!user?.id || !otherUserId) return null;

      const { data, error } = await (supabase as any)
        .from("user_connections")
        .select("*")
        .or(
          `and(user_id.eq.${user.id},connected_user_id.eq.${otherUserId}),and(user_id.eq.${otherUserId},connected_user_id.eq.${user.id})`
        )
        .maybeSingle();

      if (error) throw error;
      return data as Connection | null;
    },
  });
};

// List pending incoming connection requests
export const usePendingRequests = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["pending-requests", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await (supabase as any)
        .from("user_connections")
        .select(`
          id,
          user_id,
          created_at,
          requester:user_id (full_name, avatar_url)
        `)
        .eq("connected_user_id", user.id)
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as any[];
    },
  });
};

// Send a message
export const useSendMessage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ recipientId, content }: { recipientId: string; content: string }) => {
      if (!user?.id) throw new Error("Not authenticated");

      const { data, error } = await supabase.rpc("send_dm", {
        sender: user.id,
        recipient: recipientId,
        message_text: content,
      });

      if (error) throw error;
      return data as Message[];
    },
    onSuccess: (data, { recipientId }) => {
      const newMessage = Array.isArray(data) ? data[0] : data;

      // Update messages cache
      qc.setQueryData(
        ["messages", user?.id, recipientId],
        (old: Message[] | undefined) => {
          if (!old) return newMessage ? [newMessage] : [];
          if (newMessage && old.some((m) => m.id === newMessage.id)) return old;
          return newMessage ? [...old, newMessage] : old;
        }
      );

      // Invalidate conversations to refresh last message
      qc.invalidateQueries({ queryKey: ["conversations", user?.id] });
    },
    onError: (e: any) =>
      toast({ title: "Failed to send", description: e.message, variant: "destructive" }),
  });
};

// Send a connection request
export const useSendConnectionRequest = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (connectedUserId: string) => {
      if (!user?.id) throw new Error("Not authenticated");

      const { data, error } = await (supabase as any)
        .from("user_connections")
        .insert({
          user_id: user.id,
          connected_user_id: connectedUserId,
          status: "pending",
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, connectedUserId) => {
      qc.invalidateQueries({ queryKey: ["connections", user?.id] });
      qc.invalidateQueries({ queryKey: ["connection-status", user?.id, connectedUserId] });
      toast({ title: "Connection request sent!" });
    },
    onError: (e: any) =>
      toast({ title: "Failed to connect", description: e.message, variant: "destructive" }),
  });
};

// Accept a connection request
export const useAcceptConnection = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (connectionId: string) => {
      if (!user?.id) throw new Error("Not authenticated");

      const { data, error } = await (supabase as any)
        .from("user_connections")
        .update({ status: "connected" })
        .eq("id", connectionId)
        .eq("connected_user_id", user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["connections", user?.id] });
      qc.invalidateQueries({ queryKey: ["pending-requests", user?.id] });
      toast({ title: "Connection accepted!" });
    },
    onError: (e: any) =>
      toast({ title: "Failed to accept", description: e.message, variant: "destructive" }),
  });
};

// Reject a connection request
export const useRejectConnection = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (connectionId: string) => {
      if (!user?.id) throw new Error("Not authenticated");

      const { error } = await (supabase as any)
        .from("user_connections")
        .delete()
        .eq("id", connectionId)
        .eq("connected_user_id", user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["connections", user?.id] });
      qc.invalidateQueries({ queryKey: ["pending-requests", user?.id] });
      toast({ title: "Connection request declined" });
    },
    onError: (e: any) =>
      toast({ title: "Failed to reject", description: e.message, variant: "destructive" }),
  });
};

// Remove an existing connection
export const useRemoveConnection = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (connectionId: string) => {
      if (!user?.id) throw new Error("Not authenticated");

      const { error } = await (supabase as any)
        .from("user_connections")
        .delete()
        .eq("id", connectionId);

      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["connections", user?.id] });
      toast({ title: "Connection removed" });
    },
    onError: (e: any) =>
      toast({ title: "Failed to remove", description: e.message, variant: "destructive" }),
  });
};
