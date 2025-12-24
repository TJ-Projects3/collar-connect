import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

// List conversations with last message time per counterpart
export const useConversations = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["conversations", user?.id],
    enabled: !!user?.id,
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
      const { data, error } = await supabase
        .from("messages" as any)
        .insert({ sender_id: user.id, recipient_id: recipientId, content })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_d, { recipientId }) => {
      qc.invalidateQueries({ queryKey: ["conversations", user?.id] });
      toast({ title: "Message sent" });
    },
    onError: (e: any) => toast({ title: "Failed to send", description: e.message, variant: "destructive" }),
  });
};
