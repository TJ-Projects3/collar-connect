import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface MessageProfile {
  full_name: string | null;
  avatar_url: string | null;
}

interface Conversation {
  counterpart_id: string;
  counterpart_profile: MessageProfile | null;
  last_message: {
    content: string;
    created_at: string;
  } | null;
}

// List conversations with last message per counterpart
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
    queryFn: async () => {
      // Fetch messages involving the user with profile joins
      const { data, error } = await supabase
        .from("messages")
        .select(`
          id, sender_id, recipient_id, content, created_at,
          sender:sender_id (full_name, avatar_url),
          recipient:recipient_id (full_name, avatar_url)
        `)
        .or(`sender_id.eq.${user!.id},recipient_id.eq.${user!.id}`)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Cast and process the data
      const messages = data as unknown as Array<{
        id: string;
        sender_id: string;
        recipient_id: string;
        content: string;
        created_at: string;
        sender: MessageProfile | null;
        recipient: MessageProfile | null;
      }>;

      // Group by counterpart and compute last message
      const map = new Map<string, Conversation>();
      for (const m of messages) {
        const counterpartId = m.sender_id === user!.id ? m.recipient_id : m.sender_id;
        if (!map.has(counterpartId)) {
          map.set(counterpartId, {
            counterpart_id: counterpartId,
            counterpart_profile: m.sender_id === user!.id ? m.recipient : m.sender,
            last_message: { content: m.content, created_at: m.created_at },
          });
        }
      }
      return Array.from(map.values());
    },
  });

  // Set up real-time subscription for incoming messages
  useEffect(() => {
    if (!user?.id) return;

    const subscription = supabase
      .channel("messages-realtime")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `recipient_id=eq.${user.id}`,
        },
        async (payload) => {
          const newMessage = payload.new as { sender_id: string; content: string; created_at: string };
          const senderId = newMessage.sender_id;

          // Fetch sender profile
          const { data: senderProfile } = await supabase
            .from("profiles")
            .select("full_name, avatar_url")
            .eq("id", senderId)
            .maybeSingle();

          // Update cache
          qc.setQueryData(["conversations", user.id], (old: Conversation[] | undefined) => {
            const newConversation: Conversation = {
              counterpart_id: senderId,
              counterpart_profile: senderProfile,
              last_message: { content: newMessage.content, created_at: newMessage.created_at },
            };

            if (!old || old.length === 0) {
              return [newConversation];
            }

            const idx = old.findIndex((c) => c.counterpart_id === senderId);
            if (idx >= 0) {
              const updated = [...old];
              const [conversation] = updated.splice(idx, 1);
              conversation.last_message = { content: newMessage.content, created_at: newMessage.created_at };
              return [conversation, ...updated];
            }

            return [newConversation, ...old];
          });

          // Invalidate conversation messages if viewing this chat
          qc.invalidateQueries({ queryKey: ["conversation-messages", senderId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [user?.id, qc]);

  return query;
};

// Fetch all messages between current user and a specific recipient
export const useConversationMessages = (recipientId: string | null) => {
  const { user } = useAuth();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["conversation-messages", recipientId],
    enabled: !!user?.id && !!recipientId,
    staleTime: 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("messages")
        .select(`
          id, sender_id, recipient_id, content, created_at,
          sender:sender_id (full_name, avatar_url)
        `)
        .or(
          `and(sender_id.eq.${user!.id},recipient_id.eq.${recipientId}),and(sender_id.eq.${recipientId},recipient_id.eq.${user!.id})`
        )
        .order("created_at", { ascending: true });

      if (error) throw error;
      
      return data as unknown as Array<{
        id: string;
        sender_id: string;
        recipient_id: string;
        content: string;
        created_at: string;
        sender: MessageProfile | null;
      }>;
    },
  });

  // Real-time subscription for new messages in this conversation
  useEffect(() => {
    if (!user?.id || !recipientId) return;

    const subscription = supabase
      .channel(`chat-${recipientId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        (payload) => {
          const newMessage = payload.new as { sender_id: string; recipient_id: string };
          // Only update if message is part of this conversation
          const isRelevant =
            (newMessage.sender_id === user.id && newMessage.recipient_id === recipientId) ||
            (newMessage.sender_id === recipientId && newMessage.recipient_id === user.id);

          if (isRelevant) {
            qc.invalidateQueries({ queryKey: ["conversation-messages", recipientId] });
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
      return data;
    },
    onSuccess: async (data, { recipientId }) => {
      // Fetch recipient profile for name + avatar
      let counterpartProfile: MessageProfile | null = null;
      try {
        const { data: profileData } = await supabase
          .from("profiles")
          .select("full_name, avatar_url")
          .eq("id", recipientId)
          .maybeSingle();
        counterpartProfile = profileData;
      } catch {
        counterpartProfile = null;
      }

      const inserted = (data as Array<{ content: string; created_at: string }>)?.[0];

      // Instant UI update: inject or update the counterpart in Recent Chats
      qc.setQueryData(["conversations", user?.id], (old: Conversation[] | undefined) => {
        const lastMessage = inserted
          ? { content: inserted.content, created_at: inserted.created_at }
          : null;

        if (!old || old.length === 0) {
          return [
            {
              counterpart_id: recipientId,
              counterpart_profile: counterpartProfile,
              last_message: lastMessage,
            },
          ];
        }

        const idx = old.findIndex((c) => c.counterpart_id === recipientId);
        if (idx >= 0) {
          const updated = [...old];
          const [conversation] = updated.splice(idx, 1);
          conversation.last_message = lastMessage;
          conversation.counterpart_profile = conversation.counterpart_profile ?? counterpartProfile;
          return [conversation, ...updated];
        }

        return [
          {
            counterpart_id: recipientId,
            counterpart_profile: counterpartProfile,
            last_message: lastMessage,
          },
          ...old,
        ];
      });

      // Invalidate messages for this conversation
      qc.invalidateQueries({ queryKey: ["conversation-messages", recipientId] });

      toast({ title: "Message sent" });
    },
    onError: (e: Error) => toast({ title: "Failed to send", description: e.message, variant: "destructive" }),
  });
};
