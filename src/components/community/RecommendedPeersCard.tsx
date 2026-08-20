import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { UserPlus, Users } from "lucide-react";
import { useRecommendedPeers } from "@/hooks/useRecommendedPeers";
import { useSendConnectionRequest } from "@/hooks/useConnections";

const initialsOf = (name?: string | null) =>
  (name || "U").split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();

export const RecommendedPeersCard = ({ limit = 5 }: { limit?: number }) => {
  const { peers, isLoading, isStudent } = useRecommendedPeers(limit);
  const sendRequest = useSendConnectionRequest();

  if (!isStudent) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-secondary" />
          <h3 className="font-semibold">Recommended Peers</h3>
        </div>
        <p className="text-xs text-muted-foreground">
          Students who share your skills, grad year, or goals.
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading && (
          <>
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </>
        )}

        {!isLoading && peers.length === 0 && (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Add your skills, university, and grad year to your profile to get peer matches.
            </p>
            <Button asChild variant="outline" size="sm" className="w-full">
              <Link to="/my-network">Browse the network</Link>
            </Button>
          </div>
        )}

        {peers.map(({ profile, reasons }) => (
          <div key={profile.id} className="flex items-start gap-2">
            <Link to={`/profile?userId=${profile.id}`} className="shrink-0">
              <Avatar className="h-9 w-9">
                <AvatarImage src={profile.avatar_url || undefined} />
                <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                  {initialsOf(profile.full_name)}
                </AvatarFallback>
              </Avatar>
            </Link>
            <div className="min-w-0 flex-1">
              <Link
                to={`/profile?userId=${profile.id}`}
                className="text-sm font-medium hover:underline block truncate"
              >
                {profile.full_name || "Student"}
              </Link>
              <p className="text-xs text-muted-foreground truncate">
                {[profile.university, profile.major].filter(Boolean).join(" · ") ||
                  profile.job_title ||
                  "Student"}
              </p>
              {reasons.length > 0 && (
                <p className="text-[11px] text-secondary truncate">{reasons[0]}</p>
              )}
            </div>
            <Button
              size="sm"
              variant="ghost"
              className="h-8 px-2 shrink-0"
              disabled={sendRequest.isPending}
              onClick={() => sendRequest.mutate(profile.id)}
              aria-label={`Connect with ${profile.full_name || "student"}`}
            >
              <UserPlus className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
