import { Navbar } from "@/components/Navbar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Bell, MessageCircle, Users, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { useNotifications, useMarkNotificationRead, useMarkAllNotificationsRead } from "@/hooks/useNotifications";
import { usePendingConnectionRequests, useAcceptConnectionRequest, useRejectConnectionRequest } from "@/hooks/useConnections";
import { useToast } from "@/hooks/use-toast";

const Notifications = () => {
  const { data: notifications = [] } = useNotifications();
  const { data: pendingRequests = [] } = usePendingConnectionRequests();
  const { mutate: markAsRead } = useMarkNotificationRead();
  const { mutate: markAllRead, isPending: markingAllRead } = useMarkAllNotificationsRead();
  const { mutate: acceptRequest, isPending: accepting } = useAcceptConnectionRequest();
  const { mutate: rejectRequest, isPending: rejecting } = useRejectConnectionRequest();
  const { toast } = useToast();

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "connection_request":
        return <Users className="h-5 w-5 text-blue-500" />;
      case "connection_accepted":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "message":
        return <MessageCircle className="h-5 w-5 text-purple-500" />;
      default:
        return <Bell className="h-5 w-5 text-primary" />;
    }
  };

  const getNotificationBadgeColor = (type: string) => {
    switch (type) {
      case "connection_request":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400";
      case "connection_accepted":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400";
      case "message":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400";
      default:
        return "bg-primary/10 text-primary";
    }
  };

  const unreadCount = (notifications as any[]).filter((n) => !n.is_read).length;

  const handleAccept = (connectionId: string) => {
    acceptRequest(connectionId);
  };

  const handleReject = (connectionId: string) => {
    rejectRequest(connectionId);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto px-4 py-6 max-w-3xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Bell className="h-8 w-8" />
              Notifications
            </h1>
            {(unreadCount > 0 || (pendingRequests as any[]).length > 0) && (
              <p className="text-sm text-muted-foreground mt-1">
                {unreadCount > 0 && `${unreadCount} unread notification${unreadCount !== 1 ? "s" : ""}`}
                {unreadCount > 0 && (pendingRequests as any[]).length > 0 && " • "}
                {(pendingRequests as any[]).length > 0 && `${(pendingRequests as any[]).length} pending connection request${(pendingRequests as any[]).length !== 1 ? "s" : ""}`}
              </p>
            )}
          </div>
          {unreadCount > 0 && (
            <Button
              variant="outline"
              onClick={() => markAllRead()}
              disabled={markingAllRead}
            >
              {markingAllRead ? <Loader2 className="h-4 w-4 animate-spin" /> : "Mark all as read"}
            </Button>
          )}
        </div>

        <div className="space-y-4">
          {/* Pending Connection Requests Section */}
          {(pendingRequests as any[]).length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Users className="h-5 w-5" />
                Connection Requests ({(pendingRequests as any[]).length})
              </h2>
              <div className="space-y-3">
                {(pendingRequests as any[]).map((request: any) => {
                  const isProcessing = accepting || rejecting;
                  const requester = request.requester;

                  return (
                    <Card key={request.id} className="border-blue-200 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-800">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 flex-1">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={requester?.avatar_url} alt={requester?.full_name} />
                              <AvatarFallback>
                                {requester?.full_name
                                  ?.split(" ")
                                  .map((n: string) => n[0])
                                  .join("")
                                  .toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm">{requester?.full_name}</p>
                              {requester?.job_title && (
                                <p className="text-xs text-muted-foreground">{requester.job_title}</p>
                              )}
                              <p className="text-xs text-muted-foreground mt-1">
                                {format(new Date(request.created_at), "MMM d, yyyy")}
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-2 ml-4">
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => handleAccept(request.id)}
                              disabled={isProcessing}
                              className="gap-1"
                            >
                              {accepting ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <CheckCircle className="h-3 w-3" />
                              )}
                              Accept
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleReject(request.id)}
                              disabled={isProcessing}
                              className="gap-1"
                            >
                              {rejecting ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <XCircle className="h-3 w-3" />
                              )}
                              Reject
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {/* Notifications Section */}
          {(notifications as any[]).length === 0 && (pendingRequests as any[]).length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Bell className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium">No notifications yet</p>
                <p className="text-sm text-muted-foreground">
                  You're all caught up! Notifications will appear here.
                </p>
              </CardContent>
            </Card>
          ) : (notifications as any[]).length > 0 ? (
            <>
              <h2 className="text-lg font-semibold mt-6 mb-3">Recent Notifications</h2>
              <div className="space-y-3">
                {(notifications as any[]).map((notification: any) => (
                  <Card
                    key={notification.id}
                    className={notification.is_read ? "" : "border-primary/50 bg-primary/5"}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1">
                          <div className="flex-shrink-0">
                            {getNotificationIcon(notification.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge
                                className={`text-xs ${getNotificationBadgeColor(notification.type)}`}
                                variant="secondary"
                              >
                                {notification.type}
                              </Badge>
                            </div>
                            <p className="text-sm mt-1">{notification.content}</p>
                            <p className="text-xs text-muted-foreground mt-2">
                              {format(new Date(notification.created_at), "MMM d, yyyy 'at' h:mm a")}
                            </p>
                          </div>
                        </div>
                        {!notification.is_read && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="ml-4"
                            onClick={() => markAsRead(notification.id)}
                          >
                            Mark as read
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default Notifications;
