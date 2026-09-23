import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { UserAvatar } from "@/components/ui/user-avatar";
import { useUserConnections } from "@/hooks/useConnections";

interface ConnectionsSidebarProps {
  currentUserId: string | null;
  onViewAll: () => void;
}

export const ConnectionsSidebar = ({ currentUserId, onViewAll }: ConnectionsSidebarProps) => {
  const { data: allConnections = [], isLoading } = useUserConnections(currentUserId);
  const connections = allConnections.slice(0, 5);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Connections ({allConnections.length})</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={onViewAll}
            className="transition-all duration-200"
          >
            View all
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading ? (
          <p className="text-sm text-muted-foreground text-center">Loading...</p>
        ) : connections.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center">No connections yet</p>
        ) : (
          connections.map((connection) => (
            <Link
              key={connection.id}
              to={`/profile?userId=${connection.id}`}
              className="flex items-center gap-3 rounded-lg p-1 -mx-1 hover:bg-muted/50 transition-all duration-200"
            >
              <UserAvatar
                src={connection.avatar_url}
                name={connection.full_name}
                className="h-10 w-10 flex-shrink-0"
                fallbackClassName="bg-secondary text-secondary-foreground"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{connection.full_name || "Unknown"}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {connection.job_title || "Tech Professional"}
                </p>
              </div>
            </Link>
          ))
        )}
      </CardContent>
    </Card>
  );
};
