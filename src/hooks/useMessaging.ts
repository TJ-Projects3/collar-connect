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
      // Fetch messages involving the user
      const { data, error } = await supabase
        .from("messages" as any)
        .select(`
          id, sender_id, recipient_id, content, created_at,
          sender:sender_id (full_name, avatar_url),
          recipient:recipient_id (full_name, avatar_url)
        `)
        .or(`sender_id.eq.${user!.id},recipient_id.eq.${user!.id}`)
        .order("created_at", { ascending: false });
      if (error) throw error;

      // Group by counterpart and compute last message
      const map = new Map<string, any>();
      for (const m of data as any[]) {
        const counterpartId = m.sender_id === user!.id ? m.recipient_id : m.sender_id;
        if (!map.has(counterpartId)) {
          map.set(counterpartId, {
            counterpart_id: counterpartId,
            counterpart_profile: m.sender_id === user!.id ? m.recipient : m.sender,
            last_message: m,
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
      .channel("messages")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `recipient_id=eq.${user.id}`,
        },
        async (payload) => {
          const newMessage = payload.new as any;

          // Fetch sender profile
          const { data: senderProfile } = await supabase
            .from("profiles")
            .select("full_name, avatar_url")
            .eq("id", newMessage.sender_id)
            .maybeSingle();

          // Update cache: add or update conversation for this sender
          qc.setQueryData(["conversations", user.id], (old: any[] | undefined) => {
            const counterpartId = newMessage.sender_id;
            const newConversation = {
              counterpart_id: counterpartId,
              counterpart_profile: senderProfile,
              last_message: newMessage,
            };

            if (!old || old.length === 0) {
              return [newConversation];
            }

            const idx = old.findIndex((c: any) => c.counterpart_id === counterpartId);
            if (idx >= 0) {
              const updated = [...old];
              const [conversation] = updated.splice(idx, 1);
              conversation.last_message = newMessage;
              return [conversation, ...updated];
            }

            return [newConversation, ...old];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [user?.id, qc]);

  return query;
};

// List connections for current user
export const useConnections = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["connections", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_connections" as any)
        .select(`
          *,
          user:user_id (full_name, avatar_url),
          connected:connected_user_id (full_name, avatar_url)
        `)
        .or(`user_id.eq.${user!.id},connected_user_id.eq.${user!.id}`)
        .order("created_at", { ascending: false });
      if (error) throw error;

      // Normalize to show the other person
      return (data as any[]).map((c) => {
        const other = c.user_id === user!.id ? c.connected : c.user;
        const otherId = c.user_id === user!.id ? c.connected_user_id : c.user_id;
        return { other_id: otherId, other_profile: other, status: c.status, created_at: c.created_at };
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
    mutationFn: async (connectedUserId: string) => {
      if (!user?.id) throw new Error("Not authenticated");
      const { data, error } = await supabase
        .from("user_connections" as any)
        .insert({
          user_id: user.id,
          connected_user_id: connectedUserId,
          status: "connected",
          created_at: new Date().toISOString(),
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["connections", user?.id] });
      toast({ title: "Connection added!" });
    },
    onError: (e: any) => toast({ title: "Failed to connect", description: e.message, variant: "destructive" }),
  });
};
