import { useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Bell, MessageCircle, Users, CheckCircle, ThumbsUp, MessageSquare } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import {
  groupLabel,
  notificationLink,
  useMarkNotificationsRead,
  type NotificationGroup,
} from "@/hooks/useNotifications";

const icon = (type: string) => {
  switch (type) {
    case "connection_request":
      return <Users className="h-4 w-4 text-blue-500" />;
    case "connection_accepted":
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    case "message":
      return <MessageCircle className="h-4 w-4 text-purple-500" />;
    case "post_like":
      return <ThumbsUp className="h-4 w-4 text-primary" />;
    case "post_reply":
      return <MessageSquare className="h-4 w-4 text-secondary" />;
    default:
      return <Bell className="h-4 w-4 text-primary" />;
  }
};

const typeLabel = (type: string) =>
  ({
    post_like: "reaction",
    post_reply: "reply",
    connection_request: "connection request",
    connection_accepted: "connection",
    message: "message",
  } as Record<string, string>)[type] || type;

const getInitials = (name?: string | null) =>
  name ? name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) : "U";

interface NotificationListProps {
  groups: NotificationGroup[];
  compact?: boolean;
  onNavigate?: () => void;
  emptyMessage?: string;
}

export const NotificationList = ({
  groups,
  compact = false,
  onNavigate,
  emptyMessage = "You're all caught up!",
}: NotificationListProps) => {
  const navigate = useNavigate();
  const markRead = useMarkNotificationsRead();

  if (groups.length === 0) {
    return (
      <div className="py-8 text-center text-sm text-muted-foreground">{emptyMessage}</div>
    );
  }

  const handleClick = (group: NotificationGroup) => {
    if (!group.is_read) markRead.mutate(group.ids);
    onNavigate?.();
    navigate(notificationLink(group));
  };

  return (
    <ul className={cn("divide-y divide-border", compact && "max-h-[22rem] overflow-y-auto")}>
      {groups.map((group) => (
        <li key={group.key}>
          <button
            type="button"
            onClick={() => handleClick(group)}
            className={cn(
              "w-full text-left flex gap-3 px-3 py-3 transition-colors hover:bg-muted/60",
              !group.is_read && "bg-primary/5"
            )}
          >
            <div className="relative flex-shrink-0">
              <Avatar className={compact ? "h-9 w-9" : "h-10 w-10"}>
                <AvatarImage src={group.senders[0]?.avatar_url || undefined} />
                <AvatarFallback className="bg-secondary text-secondary-foreground text-xs">
                  {getInitials(group.senders[0]?.full_name)}
                </AvatarFallback>
              </Avatar>
              <span className="absolute -bottom-1 -right-1 rounded-full bg-background p-0.5">
                {icon(group.type)}
              </span>
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-[10px]">
                  {typeLabel(group.type)}
                </Badge>
                {!group.is_read && <span className="h-2 w-2 rounded-full bg-primary" />}
              </div>
              <p className={cn("mt-1 text-sm", !group.is_read && "font-medium")}>
                {groupLabel(group)}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(group.created_at), { addSuffix: true })}
              </p>
            </div>
          </button>
        </li>
      ))}
    </ul>
  );
};
