import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export interface MessageProfile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
}

export interface ConversationParticipant {
  user_id: string;
  role: "admin" | "member";
  joined_at: string;
  profile: MessageProfile | null;
}

export interface ConversationSummary {
  id: string;
  is_group: boolean;
  title: string | null;
  avatar_url: string | null;
  created_by: string | null;
  my_role: "admin" | "member";
  participants: ConversationParticipant[];
  /** Only set for 1:1 conversations */
  counterpart_id: string | null;
  counterpart_profile: MessageProfile | null;
  last_message: { content: string; created_at: string } | null;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  recipient_id: string | null;
  content: string;
  created_at: string;
}

const fetchProfiles = async (ids: string[]): Promise<Map<string, MessageProfile>> => {
  const map = new Map<string, MessageProfile>();
  const unique = Array.from(new Set(ids.filter(Boolean)));
  if (unique.length === 0) return map;

  const { data } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url")
    .in("id", unique);

  for (const p of data ?? []) map.set(p.id, p as MessageProfile);
  return map;
};

export const conversationDisplayName = (
  c: Pick<ConversationSummary, "is_group" | "title" | "counterpart_profile">
) => {
  if (c.is_group) return c.title || "Group chat";
  return c.counterpart_profile?.full_name || "Unknown";
};

// List conversations (direct + group) ordered by most recent activity
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
    queryFn: async (): Promise<ConversationSummary[]> => {
      const { data: myRows, error: myErr } = await supabase
        .from("conversation_participants")
        .select("conversation_id, role")
        .eq("user_id", user!.id);
      if (myErr) throw myErr;
      if (!myRows || myRows.length === 0) return [];

      const conversationIds = myRows.map((r) => r.conversation_id);
      const myRoleById = new Map(myRows.map((r) => [r.conversation_id, (r.role ?? "member") as "admin" | "member"]));

      const [{ data: convos, error: convoErr }, { data: participants, error: partErr }] =
        await Promise.all([
          supabase
            .from("conversations")
            .select("id, is_group, title, avatar_url, created_by, last_message, last_message_at, created_at")
            .in("id", conversationIds),
          supabase
            .from("conversation_participants")
            .select("conversation_id, user_id, role, joined_at")
            .in("conversation_id", conversationIds),
        ]);
      if (convoErr) throw convoErr;
      if (partErr) throw partErr;

      const profiles = await fetchProfiles((participants ?? []).map((p) => p.user_id));

      const byConversation = new Map<string, ConversationParticipant[]>();
      for (const p of participants ?? []) {
        const list = byConversation.get(p.conversation_id) ?? [];
        list.push({
          user_id: p.user_id,
          role: (p.role ?? "member") as "admin" | "member",
          joined_at: p.joined_at,
          profile: profiles.get(p.user_id) ?? null,
        });
        byConversation.set(p.conversation_id, list);
      }

      const summaries: ConversationSummary[] = (convos ?? []).map((c) => {
        const members = byConversation.get(c.id) ?? [];
        const counterpart = c.is_group ? null : members.find((m) => m.user_id !== user!.id) ?? null;
        return {
          id: c.id,
          is_group: !!c.is_group,
          title: c.title,
          avatar_url: c.avatar_url,
          created_by: c.created_by,
          my_role: myRoleById.get(c.id) ?? "member",
          participants: members,
          counterpart_id: counterpart?.user_id ?? null,
          counterpart_profile: counterpart?.profile ?? null,
          last_message:
            c.last_message && c.last_message_at
              ? { content: c.last_message, created_at: c.last_message_at }
              : null,
        };
      });

      return summaries.sort((a, b) => {
        const at = a.last_message?.created_at ?? "";
        const bt = b.last_message?.created_at ?? "";
        return bt.localeCompare(at);
      });
    },
  });

  // Real-time: refresh lists and open threads on new messages
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel("messages-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          const msg = payload.new as Message;
          qc.invalidateQueries({ queryKey: ["conversations", user.id] });
          qc.invalidateQueries({ queryKey: ["conversation-messages", msg.conversation_id] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, qc]);

  return query;
};

// Resolve the direct conversation with a given user, if one already exists
export const useDirectConversationId = (recipientId: string | null) => {
  const { data: conversations = [] } = useConversations();
  if (!recipientId) return null;
  return conversations.find((c) => !c.is_group && c.counterpart_id === recipientId)?.id ?? null;
};

// Messages for a conversation, with sender profiles resolved
export const useConversationMessages = (conversationId: string | null) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["conversation-messages", conversationId],
    enabled: !!user?.id && !!conversationId,
    staleTime: 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("messages")
        .select("id, conversation_id, sender_id, recipient_id, content, created_at")
        .eq("conversation_id", conversationId!)
        .order("created_at", { ascending: true });
      if (error) throw error;

      const profiles = await fetchProfiles((data ?? []).map((m) => m.sender_id));
      return (data ?? []).map((m) => ({
        ...(m as Message),
        sender_profile: profiles.get(m.sender_id) ?? null,
      }));
    },
  });
};

export type MessageWithSender = Message & { sender_profile: MessageProfile | null };

// Send a message to a group conversation or a direct recipient
export const useSendMessage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({
      conversationId,
      recipientId,
      content,
      isGroup,
    }: {
      conversationId?: string | null;
      recipientId?: string | null;
      content: string;
      isGroup?: boolean;
    }) => {
      if (!user?.id) throw new Error("Not authenticated");

      if (isGroup) {
        if (!conversationId) throw new Error("Missing conversation");
        const { data, error } = await supabase.rpc("send_group_message", {
          _conversation_id: conversationId,
          _content: content,
        });
        if (error) throw error;
        return data as Message[];
      }

      if (!recipientId) throw new Error("Missing recipient");
      const { data, error } = await supabase.rpc("send_dm", {
        sender: user.id,
        recipient: recipientId,
        message_text: content,
      });
      if (error) throw error;
      return data as Message[];
    },
    onSuccess: (data) => {
      const inserted = data?.[0];
      qc.invalidateQueries({ queryKey: ["conversations", user?.id] });
      if (inserted?.conversation_id) {
        qc.invalidateQueries({ queryKey: ["conversation-messages", inserted.conversation_id] });
      }
    },
    onError: (e: Error) =>
      toast({ title: "Failed to send", description: e.message, variant: "destructive" }),
  });
};
