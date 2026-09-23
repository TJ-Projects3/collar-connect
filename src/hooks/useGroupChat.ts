import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

const useGroupMutation = <TArgs, TResult>(
  fn: (args: TArgs) => Promise<TResult>,
  successTitle: string
) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: fn,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["conversations", user?.id] });
      toast({ title: successTitle });
    },
    onError: (e: Error) =>
      toast({ title: "Something went wrong", description: e.message, variant: "destructive" }),
  });
};

export const useCreateGroupConversation = () =>
  useGroupMutation(async ({ title, participantIds }: { title: string; participantIds: string[] }) => {
    const { data, error } = await supabase.rpc("create_group_conversation", {
      _title: title,
      _participant_ids: participantIds,
      _avatar_url: null,
    });
    if (error) throw error;
    return data as string;
  }, "Group created");

export const useAddGroupParticipants = () =>
  useGroupMutation(
    async ({ conversationId, participantIds }: { conversationId: string; participantIds: string[] }) => {
      const { error } = await supabase.rpc("add_group_participants", {
        _conversation_id: conversationId,
        _participant_ids: participantIds,
      });
      if (error) throw error;
    },
    "Members added"
  );

export const useRemoveGroupParticipant = () =>
  useGroupMutation(
    async ({ conversationId, userId }: { conversationId: string; userId: string }) => {
      const { error } = await supabase.rpc("remove_group_participant", {
        _conversation_id: conversationId,
        _user_id: userId,
      });
      if (error) throw error;
    },
    "Member removed"
  );

export const useLeaveGroup = () =>
  useGroupMutation(async ({ conversationId }: { conversationId: string }) => {
    const { error } = await supabase.rpc("leave_group", { _conversation_id: conversationId });
    if (error) throw error;
  }, "You left the group");

export const useSetParticipantRole = () =>
  useGroupMutation(
    async ({
      conversationId,
      userId,
      role,
    }: {
      conversationId: string;
      userId: string;
      role: "admin" | "member";
    }) => {
      const { error } = await supabase.rpc("set_participant_role", {
        _conversation_id: conversationId,
        _user_id: userId,
        _role: role,
      });
      if (error) throw error;
    },
    "Role updated"
  );

export const useRenameGroup = () =>
  useGroupMutation(
    async ({ conversationId, title }: { conversationId: string; title: string }) => {
      const { error } = await supabase.rpc("rename_group", {
        _conversation_id: conversationId,
        _title: title,
        _avatar_url: null,
      });
      if (error) throw error;
    },
    "Group renamed"
  );
