import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

// List conversations with last message time per counterpart
export const useConversations = () => {
  const { user } = useAuth();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["conversations", user?.id],
    enabled: !!user?.id,
    staleTime: 0,
    gcTime: 1000 * 60 * 5,
    refetchOnMount: 'always',
    refetchOnWindowFocus: false,
    queryFn: async () => {
      if (!user?.id) return [];

      // Fetch conversations where user is a participant
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

      // Transform to match expected format: get the OTHER participant
      return (data as any[]).map((conv) => {
        const otherParticipant = conv.conversation_participants?.find(
          (p: any) => p.user_id !== user!.id
        );
        const counterpartProfile = otherParticipant?.user;
        const counterpartId = otherParticipant?.user_id;

        return {
          counterpart_id: counterpartId,
          counterpart_profile: counterpartProfile,
          last_message: {
            content: conv.last_message,
            created_at: conv.last_message_at,
          },
        };
      });
    },
  });

  // Set up real-time subscription for incoming messages (conversations table)
  useEffect(() => {
    if (!user?.id) return;

    const subscription = supabase
      .channel("conversations")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "conversations",
        },
        async () => {
          // Refetch conversations when any conversation changes
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

// Fetch messages for a specific conversation/recipient
export const useConversationMessages = (recipientId: string | null) => {
  const { user } = useAuth();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["messages", user?.id, recipientId],
    enabled: !!user?.id && !!recipientId,
    staleTime: 0,
    queryFn: async () => {
      if (!user?.id || !recipientId) return [];

      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .or(`and(sender_id.eq.${user.id},recipient_id.eq.${recipientId}),and(sender_id.eq.${recipientId},recipient_id.eq.${user.id})`)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data || [];
    },
  });

  // Real-time subscription for new messages
  useEffect(() => {
    if (!user?.id || !recipientId) return;

    const subscription = supabase
      .channel(`messages:${user.id}:${recipientId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `sender_id=eq.${recipientId}`,
        },
        () => {
          qc.invalidateQueries({ queryKey: ["messages", user.id, recipientId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [user?.id, recipientId, qc]);

  return query;
};

// List connections for current user
export const useConnections = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["connections", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from("user_connections" as any)
        .select(`
          id,
          requester_id,
          receiver_id,
          status,
          created_at,
          requester:requester_id (full_name, avatar_url),
          receiver:receiver_id (full_name, avatar_url)
        `)
        .eq("status", "accepted")
        .or(`requester_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order("created_at", { ascending: false });

      if (error) throw error;

      return (data as any[]).map((c) => {
        const isRequester = c.requester_id === user.id;

        return {
          other_id: isRequester ? c.receiver_id : c.requester_id,
          other_profile: isRequester ? c.receiver : c.requester,
          status: c.status,
          created_at: c.created_at,
        };
      });
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
      const { data, error } = await (supabase as any).rpc('send_dm', {
        sender: user.id,
        recipient: recipientId,
        message_text: content,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: async (data, { recipientId }) => {
      // Fetch recipient profile for name + avatar
      let counterpartProfile: any | undefined;
      try {
        const { data: profileData } = await supabase
          .from("profiles")
          .select("full_name, avatar_url")
          .eq("id", recipientId)
          .maybeSingle();
        counterpartProfile = profileData ?? undefined;
      } catch {
        counterpartProfile = undefined;
      }

      // Instant UI update: inject or update the counterpart in Recent Chats
      qc.setQueryData(["conversations", user?.id], (old: any[] | undefined) => {
        const inserted = data as any;
        const lastMessage = inserted;
        const counterpartId = recipientId;

        if (!old || old.length === 0) {
          return [
            {
              counterpart_id: counterpartId,
              counterpart_profile: counterpartProfile,
              last_message: lastMessage,
            },
          ];
        }

        const idx = old.findIndex((c: any) => c.counterpart_id === counterpartId);
        if (idx >= 0) {
          const updated = [...old];
          updated[idx] = {
            ...updated[idx],
            counterpart_profile: updated[idx].counterpart_profile ?? counterpartProfile,
            last_message: lastMessage,
          };
          return updated;
        }

        return [
          {
            counterpart_id: counterpartId,
            counterpart_profile: counterpartProfile,
            last_message: lastMessage,
          },
          ...old,
        ];
      });

      toast({ title: "Message sent" });
    },
    onError: (e: any) => toast({ title: "Failed to send", description: e.message, variant: "destructive" }),
  });
};

// Add a connection
export const useAddConnection = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (otherUserId: string) => {
      if (!user?.id) throw new Error("Not authenticated");

      // Check existing connection
      const { data: existing, error: checkError } = await supabase
        .from("user_connections" as any)
        .select("id")
        .or(
          `and(requester_id.eq.${user.id},receiver_id.eq.${otherUserId}),and(requester_id.eq.${otherUserId},receiver_id.eq.${user.id})`
        );

      if (checkError) throw checkError;

      if (existing && existing.length > 0) {
        throw new Error("Connection already exists");
      }

      const { data, error } = await supabase
        .from("user_connections" as any)
        .insert({
          requester_id: user.id,
          receiver_id: otherUserId,
          status: "pending",
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },

    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["connections", user?.id] });
      toast({ title: "Connection request sent!" });
    },

    onError: (e: any) =>
      toast({
        title: "Failed to connect",
        description: e.message,
        variant: "destructive",
      }),
  });
};
