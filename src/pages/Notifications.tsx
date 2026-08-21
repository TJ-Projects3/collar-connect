import { Navbar } from "@/components/Navbar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Bell, Users, CheckCircle, CheckCircle2, XCircle, Loader2, Trash2 } from "lucide-react";
import { format } from "date-fns";
import {
  useGroupedNotifications,
  useMarkAllNotificationsRead,
  useClearAllNotifications,
} from "@/hooks/useNotifications";
import { NotificationList } from "@/components/notifications/NotificationList";
import { usePendingConnectionRequests, useAcceptConnectionRequest, useRejectConnectionRequest } from "@/hooks/useConnections";
import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const Notifications = () => {
  const { data: groups = [] } = useGroupedNotifications();
  const { data: pendingRequests = [] } = usePendingConnectionRequests();
  const { mutate: markAllRead, isPending: markingAllRead } = useMarkAllNotificationsRead();
  const { mutate: clearAll, isPending: clearingAll } = useClearAllNotifications();
  const { mutate: acceptRequest, isPending: accepting } = useAcceptConnectionRequest();
  const { mutate: rejectRequest, isPending: rejecting } = useRejectConnectionRequest();
  const [clearDialogOpen, setClearDialogOpen] = useState(false);

  const unreadCount = groups.reduce((sum, g) => sum + (g.is_read ? 0 : g.ids.length), 0);
  const hasNotifications = groups.length > 0;

  const handleClearAll = () => {
    clearAll(undefined, {
      onSuccess: () => setClearDialogOpen(false),
    });
  };

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
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <Button
                variant="outline"
                onClick={() => markAllRead()}
                disabled={markingAllRead}
              >
                {markingAllRead ? <Loader2 className="h-4 w-4 animate-spin" /> : "Mark all as read"}
              </Button>
            )}
            {hasNotifications && (
              <Button
                variant="outline"
                onClick={() => setClearDialogOpen(true)}
                disabled={clearingAll}
                className="text-destructive hover:text-destructive border-destructive/30 hover:bg-destructive/10"
              >
                {clearingAll ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4 mr-1" />}
                Clear all
              </Button>
            )}
          </div>
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
          {groups.length === 0 && (pendingRequests as any[]).length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <CheckCircle2 className="h-12 w-12 text-muted-foreground/60 mb-4" />
                <p className="text-lg font-medium">You're all caught up!</p>
                <p className="text-sm text-muted-foreground">No new notifications.</p>
              </CardContent>
            </Card>
          ) : groups.length > 0 ? (
            <>
              <h2 className="text-lg font-semibold mt-6 mb-3">Recent Notifications</h2>
              <Card>
                <CardContent className="p-0">
                  <NotificationList groups={groups} />
                </CardContent>
              </Card>
            </>
          ) : null}
        </div>
      </div>

      <AlertDialog open={clearDialogOpen} onOpenChange={setClearDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear all notifications?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete all your notifications. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleClearAll}
              disabled={clearingAll}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {clearingAll ? "Clearing..." : "Clear all"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Notifications;
