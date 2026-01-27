import { useState, useMemo, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, MapPin, Loader2, UserPlus, Check, Clock, UserCheck } from "lucide-react";
import { useAllProfiles } from "@/hooks/useAllProfiles";
import {
  useSendConnectionRequest,
  useConnectionStatus,
  usePendingRequests,
  useAcceptConnection,
  useRejectConnection,
} from "@/hooks/useMessaging";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";

// Hook to get all connection statuses for current user
const useAllConnectionStatuses = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["all-connection-statuses", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      if (!user?.id) return new Map<string, { status: string; id: string; isOutgoing: boolean }>();

      const { data, error } = await (supabase as any)
        .from("user_connections")
        .select("id, user_id, connected_user_id, status")
        .or(`user_id.eq.${user.id},connected_user_id.eq.${user.id}`);

      if (error) throw error;

      const statusMap = new Map<string, { status: string; id: string; isOutgoing: boolean }>();
      (data as any[]).forEach((conn) => {
        const otherId = conn.user_id === user.id ? conn.connected_user_id : conn.user_id;
        const isOutgoing = conn.user_id === user.id;
        statusMap.set(otherId, { status: conn.status, id: conn.id, isOutgoing });
      });

      return statusMap;
    },
  });
};

const MyNetwork = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const { data: profiles, isLoading } = useAllProfiles();
  const { user } = useAuth();
  const { data: connectionStatuses = new Map(), isLoading: statusesLoading } =
    useAllConnectionStatuses();
  const { data: pendingRequests = [] } = usePendingRequests();
  const sendConnectionRequest = useSendConnectionRequest();
  const acceptConnection = useAcceptConnection();
  const rejectConnection = useRejectConnection();
  const queryClient = useQueryClient();

  // Filter users based on search
  const filteredUsers = useMemo(() => {
    if (!profiles) return [];

    return profiles
      .filter((profile) => profile.id !== user?.id) // Exclude current user
      .filter((profile) => {
        const matchesSearch =
          searchQuery === "" ||
          profile.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          profile.job_title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          profile.location?.toLowerCase().includes(searchQuery.toLowerCase());

        return matchesSearch;
      });
  }, [profiles, searchQuery, user?.id]);

  // Get initials from full name for avatar fallback
  const getInitials = (name: string | null) => {
    if (!name) return "??";
    const names = name.trim().split(" ");
    if (names.length >= 2) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const handleConnect = (userId: string) => {
    if (!user?.id) return;
    sendConnectionRequest.mutate(userId, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["all-connection-statuses", user.id] });
      },
    });
  };

  const handleAccept = (connectionId: string) => {
    acceptConnection.mutate(connectionId, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["all-connection-statuses", user?.id] });
      },
    });
  };

  const handleReject = (connectionId: string) => {
    rejectConnection.mutate(connectionId, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["all-connection-statuses", user?.id] });
      },
    });
  };

  const getConnectionButton = (userId: string) => {
    const connectionInfo = connectionStatuses.get(userId);

    if (!connectionInfo) {
      // No connection exists
      return (
        <Button
          className="w-full"
          variant="outline"
          onClick={(e) => {
            e.preventDefault();
            handleConnect(userId);
          }}
          disabled={sendConnectionRequest.isPending}
        >
          <UserPlus className="h-4 w-4 mr-2" />
          Connect
        </Button>
      );
    }

    if (connectionInfo.status === "connected") {
      return (
        <Button className="w-full" variant="default" disabled>
          <UserCheck className="h-4 w-4 mr-2" />
          Connected
        </Button>
      );
    }

    if (connectionInfo.status === "pending") {
      if (connectionInfo.isOutgoing) {
        // User sent the request
        return (
          <Button className="w-full" variant="secondary" disabled>
            <Clock className="h-4 w-4 mr-2" />
            Pending
          </Button>
        );
      } else {
        // User received the request - show accept/reject
        return (
          <div className="flex gap-2 w-full">
            <Button
              className="flex-1"
              variant="default"
              size="sm"
              onClick={(e) => {
                e.preventDefault();
                handleAccept(connectionInfo.id);
              }}
              disabled={acceptConnection.isPending}
            >
              <Check className="h-4 w-4" />
            </Button>
            <Button
              className="flex-1"
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.preventDefault();
                handleReject(connectionInfo.id);
              }}
              disabled={rejectConnection.isPending}
            >
              Decline
            </Button>
          </div>
        );
      }
    }

    // Rejected - allow reconnecting
    return (
      <Button
        className="w-full"
        variant="outline"
        onClick={(e) => {
          e.preventDefault();
          handleConnect(userId);
        }}
        disabled={sendConnectionRequest.isPending}
      >
        <UserPlus className="h-4 w-4 mr-2" />
        Connect
      </Button>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">My Network</h1>
          <p className="text-muted-foreground">
            Connect with diverse professionals in the tech industry
          </p>
        </div>

        {/* Pending Requests Banner */}
        {pendingRequests.length > 0 && (
          <Card className="mb-6 border-primary/20 bg-primary/5">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{pendingRequests.length}</Badge>
                <h3 className="font-semibold">Pending Connection Requests</h3>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4">
                {pendingRequests.map((req: any) => (
                  <div
                    key={req.id}
                    className="flex items-center gap-3 bg-background rounded-lg p-3 border"
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={req.requester?.avatar_url || undefined} />
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {getInitials(req.requester?.full_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {req.requester?.full_name || "Unknown"}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleAccept(req.id)}
                        disabled={acceptConnection.isPending}
                      >
                        Accept
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleReject(req.id)}
                        disabled={rejectConnection.isPending}
                      >
                        Decline
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Search Bar */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search people by name, headline, or location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Results count */}
        {!isLoading && (
          <p className="text-sm text-muted-foreground mb-4">
            {filteredUsers.length} professional{filteredUsers.length !== 1 ? "s" : ""} found
          </p>
        )}

        {/* User Grid */}
        {isLoading || statusesLoading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredUsers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredUsers.map((profile) => (
              <Link
                key={profile.id}
                to={`/profile?userId=${profile.id}`}
                className="no-underline"
              >
                <Card className="hover:shadow-lg transition-all duration-300 rounded-xl border-border/50 h-full cursor-pointer">
                  <CardHeader className="space-y-4 pb-4">
                    <div className="flex flex-col items-center text-center">
                      <Avatar className="h-24 w-24 mb-3">
                        <AvatarImage
                          src={profile.avatar_url || undefined}
                          alt={profile.full_name || "User"}
                        />
                        <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                          {getInitials(profile.full_name)}
                        </AvatarFallback>
                      </Avatar>
                      <h3 className="font-semibold text-lg leading-tight mb-1">
                        {profile.full_name}
                      </h3>
                      <p className="text-sm text-muted-foreground line-clamp-2 min-h-[2.5rem]">
                        {profile.job_title || "Tech Professional"}
                      </p>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3 pt-0">
                    {profile.location && (
                      <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                        <span className="truncate">{profile.location}</span>
                      </div>
                    )}
                    {getConnectionButton(profile.id)}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              {searchQuery
                ? "No professionals match your search. Try different keywords."
                : "No professionals available yet."}
            </p>
          </div>
        )}
      </main>
    </div>
  );
};

export default MyNetwork;
