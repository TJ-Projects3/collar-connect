import { useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Bell,
  MessageCircle,
  Users,
  CheckCircle,
  CheckCircle2,
  ThumbsUp,
  MessageSquare,
  X,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  groupLabel,
  notificationLink,
  useMarkNotificationsRead,
  useMarkNotificationsUnread,
  useDeleteNotifications,
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
  emptyMessage = "No new notifications.",
}: NotificationListProps) => {
  const navigate = useNavigate();
  const markRead = useMarkNotificationsRead();
  const markUnread = useMarkNotificationsUnread();
  const deleteGroup = useDeleteNotifications();

  if (groups.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 px-4 py-10 text-center">
        <CheckCircle2 className="h-10 w-10 text-muted-foreground/60" />
        <p className="text-sm font-medium">You're all caught up!</p>
        <p className="text-xs text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  const handleClick = (group: NotificationGroup) => {
    if (!group.is_read) markRead.mutate(group.ids);
    onNavigate?.();
    navigate(notificationLink(group));
  };

  const toggleRead = (group: NotificationGroup) => {
    if (group.is_read) markUnread.mutate(group.ids);
    else markRead.mutate(group.ids);
  };

  return (
    <ul className={cn("divide-y divide-border", compact && "max-h-[22rem] overflow-y-auto")}>
      {groups.map((group) => (
        <li
          key={group.key}
          className={cn(
            "group relative transition-colors",
            group.is_read ? "bg-transparent" : "bg-primary/5"
          )}
        >
          <button
            type="button"
            onClick={() => handleClick(group)}
            className="w-full text-left flex gap-3 px-3 py-3 pr-16 transition-colors hover:bg-muted/60"
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
              <p
                className={cn(
                  "mt-1 text-sm",
                  group.is_read ? "text-muted-foreground" : "font-medium text-foreground"
                )}
              >
                {groupLabel(group)}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(group.created_at), { addSuffix: true })}
              </p>
            </div>
          </button>

          <div className="absolute right-2 top-2 flex items-center gap-1 opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100 md:focus-within:opacity-100">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  aria-label={group.is_read ? "Mark as unread" : "Mark as read"}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleRead(group);
                  }}
                  className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-muted"
                >
                  <span
                    className={cn(
                      "h-2.5 w-2.5 rounded-full border",
                      group.is_read
                        ? "border-muted-foreground/60 bg-transparent"
                        : "border-primary bg-primary"
                    )}
                  />
                </button>
              </TooltipTrigger>
              <TooltipContent side="left">
                {group.is_read ? "Mark as unread" : "Mark as read"}
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  aria-label="Dismiss notification"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteGroup.mutate(group.ids);
                  }}
                  className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="left">Dismiss</TooltipContent>
            </Tooltip>
          </div>
        </li>
      ))}
    </ul>
  );
};
