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

interface Message {
  id: string;
  sender_id: string;
  recipient_id: string;
  content: string;
  created_at: string;
}

// Fetch profile by ID
const fetchProfile = async (userId: string): Promise<MessageProfile | null> => {
  const { data } = await supabase
    .from("profiles")
    .select("full_name, avatar_url")
    .eq("id", userId)
    .maybeSingle();
  return data;
};

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
      console.log("[useConversations] Fetching messages for user:", user!.id);
      
      // Fetch messages without profile joins (no FK required)
      const { data: messages, error } = await supabase
        .from("messages")
        .select("id, sender_id, recipient_id, content, created_at")
        .or(`sender_id.eq.${user!.id},recipient_id.eq.${user!.id}`)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("[useConversations] Error fetching messages:", error);
        throw error;
      }

      console.log("[useConversations] Got messages:", messages?.length || 0);

      if (!messages || messages.length === 0) {
        return [];
      }

      // Group by counterpart and get unique counterpart IDs
      const counterpartMap = new Map<string, Message>();
      for (const m of messages) {
        const counterpartId = m.sender_id === user!.id ? m.recipient_id : m.sender_id;
        if (!counterpartMap.has(counterpartId)) {
          counterpartMap.set(counterpartId, m);
        }
      }

      // Fetch all counterpart profiles in parallel
      const counterpartIds = Array.from(counterpartMap.keys());
      const profilePromises = counterpartIds.map(id => fetchProfile(id));
      const profiles = await Promise.all(profilePromises);

      // Build conversations array
      const conversations: Conversation[] = counterpartIds.map((id, index) => {
        const lastMsg = counterpartMap.get(id)!;
        return {
          counterpart_id: id,
          counterpart_profile: profiles[index],
          last_message: { content: lastMsg.content, created_at: lastMsg.created_at },
        };
      });

      console.log("[useConversations] Built conversations:", conversations.length);
      return conversations;
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
          const newMessage = payload.new as Message;
          const senderId = newMessage.sender_id;

          console.log("[useConversations] Real-time message from:", senderId);

          // Fetch sender profile
          const senderProfile = await fetchProfile(senderId);

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
      console.log("[useConversationMessages] Fetching for user:", user!.id, "recipient:", recipientId);
      
      // Query without profile joins - just get messages
      const { data, error } = await supabase
        .from("messages")
        .select("id, sender_id, recipient_id, content, created_at")
        .or(
          `and(sender_id.eq.${user!.id},recipient_id.eq.${recipientId}),and(sender_id.eq.${recipientId},recipient_id.eq.${user!.id})`
        )
        .order("created_at", { ascending: true });

      if (error) {
        console.error("[useConversationMessages] Error:", error);
        throw error;
      }

      console.log("[useConversationMessages] Got messages:", data?.length || 0);
      return data as Message[];
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
          const newMessage = payload.new as Message;
          // Only update if message is part of this conversation
          const isRelevant =
            (newMessage.sender_id === user.id && newMessage.recipient_id === recipientId) ||
            (newMessage.sender_id === recipientId && newMessage.recipient_id === user.id);

          if (isRelevant) {
            console.log("[useConversationMessages] Real-time update for conversation");
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
      console.log("[useSendMessage] Sending to:", recipientId);
      
      const { data, error } = await supabase.rpc("send_dm", {
        sender: user.id,
        recipient: recipientId,
        message_text: content,
      });
      if (error) {
        console.error("[useSendMessage] Error:", error);
        throw error;
      }
      console.log("[useSendMessage] Success:", data);
      return data;
    },
    onSuccess: async (data, { recipientId }) => {
      // Fetch recipient profile
      const counterpartProfile = await fetchProfile(recipientId);

      const inserted = (data as Message[])?.[0];

      // Create notification for recipient
      if (inserted) {
        await supabase.from("notifications" as any).insert({
          user_id: recipientId,
          sender_id: user?.id ?? null,
          type: "message",
          reference_id: inserted.id,
          content: `New message from ${user?.user_metadata?.full_name || "Someone"}`,
        });
      }

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
