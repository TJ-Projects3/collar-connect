import { useState, useMemo, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Search, MapPin, Loader2, MessageCircle, UserPlus, UserCheck, Clock, Check, X } from "lucide-react";
import { useAllProfiles } from "@/hooks/useAllProfiles";
import { useAuth } from "@/contexts/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import { useConnectionStatus, useSendConnectionRequest, useAcceptConnectionRequest, useRejectConnectionRequest } from "@/hooks/useConnections";

// Connection button for each user card
const ConnectionButton = ({ profileId }: { profileId: string }) => {
  const { user } = useAuth();
  const { data: connectionStatus, isLoading } = useConnectionStatus(profileId);
  const sendRequest = useSendConnectionRequest();
  const acceptRequest = useAcceptConnectionRequest();
  const rejectRequest = useRejectConnectionRequest();

  if (isLoading || profileId === user?.id) return null;

  if (connectionStatus?.status === "accepted") {
    return (
      <Button variant="outline" size="sm" className="w-full" disabled>
        <UserCheck className="h-4 w-4 mr-2" />
        Connected
      </Button>
    );
  }

  if (connectionStatus?.status === "pending" && connectionStatus.receiver_id === user?.id) {
    return (
      <div className="flex gap-2 w-full">
        <Button
          size="sm"
          className="flex-1"
          onClick={(e) => { e.preventDefault(); acceptRequest.mutate(connectionStatus.id); }}
          disabled={acceptRequest.isPending}
        >
          <Check className="h-4 w-4 mr-1" />
          Accept
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="flex-1"
          onClick={(e) => { e.preventDefault(); rejectRequest.mutate(connectionStatus.id); }}
          disabled={rejectRequest.isPending}
        >
          <X className="h-4 w-4 mr-1" />
          Ignore
        </Button>
      </div>
    );
  }

  if (connectionStatus?.status === "pending" && connectionStatus.requester_id !== user?.id) {
    // Already handled above (accept/ignore for incoming)
  } else if (connectionStatus?.status === "pending") {
    return (
      <Button variant="outline" size="sm" className="w-full" disabled>
        <Clock className="h-4 w-4 mr-2" />
        Pending
      </Button>
    );
  }

  // Handle rejected state with cool-down
  if (connectionStatus?.status === "rejected") {
    const rejectedAt = new Date(connectionStatus.updated_at).getTime();
    const cooldownMs = 10 * 60 * 1000;
    const remaining = cooldownMs - (Date.now() - rejectedAt);

    if (remaining > 0) {
      return <CooldownButton remainingMs={remaining} />;
    }

    // Cool-down passed, show Connect button
    return (
      <Button
        size="sm"
        className="w-full"
        onClick={(e) => { e.preventDefault(); sendRequest.mutate(profileId); }}
        disabled={sendRequest.isPending}
      >
        <UserPlus className="h-4 w-4 mr-2" />
        Connect
      </Button>
    );
  }

  return (
    <Button
      size="sm"
      className="w-full"
      onClick={(e) => { e.preventDefault(); sendRequest.mutate(profileId); }}
      disabled={sendRequest.isPending}
    >
      <UserPlus className="h-4 w-4 mr-2" />
      Connect
    </Button>
  );
};

// Shows a countdown timer during cool-down period
const CooldownButton = ({ remainingMs }: { remainingMs: number }) => {
  const [timeLeft, setTimeLeft] = useState(remainingMs);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        const next = prev - 1000;
        if (next <= 0) {
          clearInterval(interval);
          return 0;
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  if (timeLeft <= 0) {
    // Force re-render by returning connect-like state
    return (
      <Button size="sm" className="w-full" disabled>
        <UserPlus className="h-4 w-4 mr-2" />
        Connect
      </Button>
    );
  }

  const minutes = Math.floor(timeLeft / 60000);
  const seconds = Math.floor((timeLeft % 60000) / 1000);

  return (
    <Button variant="outline" size="sm" className="w-full" disabled>
      <Clock className="h-4 w-4 mr-2" />
      Retry in {minutes}:{seconds.toString().padStart(2, "0")}
    </Button>
  );
};

const MyNetwork = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const { data: profiles, isLoading } = useAllProfiles();
  const { user } = useAuth();
  const navigate = useNavigate();

  // Filter users based on search
  const filteredUsers = useMemo(() => {
    if (!profiles) return [];

    return profiles.filter((profile) => {
      const matchesSearch =
        searchQuery === "" ||
        profile.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        profile.job_title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        profile.location?.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesSearch;
    });
  }, [profiles, searchQuery]);

  // Get initials from full name for avatar fallback
  const getInitials = (name: string | null) => {
    if (!name) return "??";
    const names = name.trim().split(" ");
    if (names.length >= 2) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const handleMessage = (userId: string) => {
    navigate(`/messages?recipientId=${userId}`);
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
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredUsers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredUsers.map((profile) => (
              <Card
                key={profile.id}
                className="hover:shadow-lg transition-all duration-300 rounded-xl border-border/50 h-full"
              >
                <Link to={`/profile?userId=${profile.id}`} className="no-underline">
                  <CardHeader className="space-y-4 pb-4">
                    <div className="flex flex-col items-center text-center">
                      <Avatar className="h-24 w-24 mb-3">
                        <AvatarImage src={profile.avatar_url || undefined} alt={profile.full_name || undefined} />
                        <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                          {getInitials(profile.full_name)}
                        </AvatarFallback>
                      </Avatar>
                      <h3 className="font-semibold text-lg leading-tight mb-1">
                        {profile.full_name || "Unknown"}
                      </h3>
                      <p className="text-sm text-muted-foreground line-clamp-2 min-h-[2.5rem]">
                        {profile.job_title || "Tech Professional"}
                      </p>
                    </div>
                  </CardHeader>
                </Link>
                <CardContent className="space-y-3 pt-0">
                  {profile.location && (
                    <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                      <span className="truncate">{profile.location}</span>
                    </div>
                  )}
                  <ConnectionButton profileId={profile.id} />
                  <Button
                    className="w-full"
                    variant="outline"
                    size="sm"
                    onClick={() => handleMessage(profile.id)}
                  >
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Message
                  </Button>
                </CardContent>
              </Card>
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
