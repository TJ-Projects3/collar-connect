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
