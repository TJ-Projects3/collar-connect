import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface Notification {
  id: string;
  user_id: string;
  sender_id: string | null;
  type: string;
  title: string | null;
  body: string | null;
  reference_id: string | null;
  secondary_reference_id?: string | null;
  is_read: boolean;
  created_at: string;
  sender?: { id: string; full_name: string | null; avatar_url: string | null } | null;
}

export interface NotificationGroup {
  key: string;
  ids: string[];
  type: string;
  title: string | null;
  body: string | null;
  reference_id: string | null;
  secondary_reference_id: string | null;
  created_at: string;
  is_read: boolean;
  senders: { id: string; full_name: string | null; avatar_url: string | null }[];
  count: number;
}

/**
 * Groups consecutive like notifications on the same post into a single row.
 * Other notification types are passed through untouched.
 */
export const groupNotifications = (notifications: Notification[]): NotificationGroup[] => {
  const groups: NotificationGroup[] = [];

  for (const n of notifications) {
    const groupable = n.type === "post_like" && !!n.reference_id;
    const prev = groups[groups.length - 1];

    if (
      groupable &&
      prev &&
      prev.type === "post_like" &&
      prev.reference_id === n.reference_id
    ) {
      prev.ids.push(n.id);
      prev.count += 1;
      prev.is_read = prev.is_read && n.is_read;
      if (n.sender && !prev.senders.some((s) => s.id === n.sender!.id)) {
        prev.senders.push(n.sender);
      }
      continue;
    }

    groups.push({
      key: n.id,
      ids: [n.id],
      type: n.type,
      title: n.title,
      body: n.body,
      reference_id: n.reference_id ?? null,
      secondary_reference_id: n.secondary_reference_id ?? null,
      created_at: n.created_at,
      is_read: n.is_read,
      senders: n.sender ? [n.sender] : [],
      count: 1,
    });
  }

  return groups;
};

export const groupLabel = (group: NotificationGroup): string => {
  if (group.type === "post_like" && group.count > 1) {
    const first = group.senders[0]?.full_name || "Someone";
    const others = group.count - 1;
    return `${first} and ${others} other${others !== 1 ? "s" : ""} reacted to your post`;
  }
  return group.body || group.title || group.type;
};

// Get all notifications for the current user
export const useNotifications = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["notifications", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notifications" as any)
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;
      const notifications = (data || []) as any[];

      // Batch-fetch sender profiles
      const senderIds = [...new Set(notifications.map(n => n.sender_id).filter(Boolean))];
      let sendersMap: Record<string, any> = {};
      if (senderIds.length > 0) {
        const { data: senders } = await supabase
          .from("profiles")
          .select("id, full_name, avatar_url")
          .in("id", senderIds);
        if (senders) {
          sendersMap = Object.fromEntries(senders.map(s => [s.id, s]));
        }
      }

      return notifications.map(n => ({
        ...n,
        sender: n.sender_id ? sendersMap[n.sender_id] || null : null,
      })) as Notification[];
    },
  });

  // Real-time subscription for new notifications
  useEffect(() => {
    if (!user?.id) return;

    const invalidate = () => {
      queryClient.invalidateQueries({ queryKey: ["notifications", user.id] });
      queryClient.invalidateQueries({ queryKey: ["notifications-unread-count", user.id] });
    };

    const subscription = supabase
      .channel(`notifications-feed-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        invalidate
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [user?.id, queryClient]);

  return query;
};

// Grouped view of the notifications list
export const useGroupedNotifications = () => {
  const { data = [], ...rest } = useNotifications();
  return { ...rest, data: groupNotifications(data as Notification[]) };
};

// Get unread notification count
export const useUnreadNotificationCount = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["notifications-unread-count", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      if (!user?.id) return 0;

      const { count, error } = await supabase
        .from("notifications" as any)
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("is_read", false);

      if (error) throw error;
      return count || 0;
    },
  });

  // Real-time subscription for unread count changes
  useEffect(() => {
    if (!user?.id) return;

    const invalidate = () => {
      queryClient.invalidateQueries({ queryKey: ["notifications-unread-count", user.id] });
    };

    const subscription = supabase
      .channel(`notifications-unread-count-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        invalidate
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [user?.id, queryClient]);

  return query;
};

// Mark notification as read
export const useMarkNotificationRead = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (notificationId: string) => {
      await supabase
        .from("notifications" as any)
        .update({ is_read: true })
        .eq("id", notificationId);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications"] });
      qc.invalidateQueries({ queryKey: ["notifications-unread-count"] });
    },
  });
};

// Mark several notifications (e.g. a grouped row) as read
export const useMarkNotificationsRead = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (notificationIds: string[]) => {
      if (notificationIds.length === 0) return;
      const { error } = await supabase
        .from("notifications" as any)
        .update({ is_read: true })
        .in("id", notificationIds);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications"] });
      qc.invalidateQueries({ queryKey: ["notifications-unread-count"] });
    },
  });
};

// Mark several notifications as unread again
export const useMarkNotificationsUnread = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (notificationIds: string[]) => {
      if (notificationIds.length === 0) return;
      const { error } = await supabase
        .from("notifications" as any)
        .update({ is_read: false })
        .in("id", notificationIds);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications"] });
      qc.invalidateQueries({ queryKey: ["notifications-unread-count"] });
    },
  });
};

// Delete a group of notifications
export const useDeleteNotifications = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (notificationIds: string[]) => {
      if (notificationIds.length === 0) return;
      const { error } = await supabase
        .from("notifications" as any)
        .delete()
        .in("id", notificationIds);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications"] });
      qc.invalidateQueries({ queryKey: ["notifications-unread-count"] });
    },
  });
};

// Mark all notifications as read
export const useMarkAllNotificationsRead = () => {
  const { user } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("notifications" as any)
        .update({ is_read: true })
        .eq("user_id", user.id)
        .eq("is_read", false);

      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications"] });
      qc.invalidateQueries({ queryKey: ["notifications-unread-count"] });
    },
  });
};

// Delete all notifications for the current user
export const useClearAllNotifications = () => {
  const { user } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("notifications" as any)
        .delete()
        .eq("user_id", user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications"] });
      qc.invalidateQueries({ queryKey: ["notifications-unread-count"] });
    },
  });
};

// Delete a notification
export const useDeleteNotification = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from("notifications" as any)
        .delete()
        .eq("id", notificationId);

      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications"] });
      qc.invalidateQueries({ queryKey: ["notifications-unread-count"] });
    },
  });
};

// Build the deep-link target for a notification group
export const notificationLink = (group: NotificationGroup): string => {
  switch (group.type) {
    case "post_like":
      return group.reference_id ? `/feed?post=${group.reference_id}` : "/feed";
    case "post_reply":
      if (!group.reference_id) return "/feed";
      return group.secondary_reference_id
        ? `/feed?post=${group.reference_id}&reply=${group.secondary_reference_id}`
        : `/feed?post=${group.reference_id}`;
    case "message":
      return group.senders[0]?.id ? `/messages?recipientId=${group.senders[0].id}` : "/messages";
    case "connection_request":
    case "connection_accepted":
      return group.senders[0]?.id ? `/profile?userId=${group.senders[0].id}` : "/my-network";
    default:
      return "/notifications";
  }
};
