import { Link } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/ui/user-avatar";
import { useUserConnections } from "@/hooks/useConnections";
import { Users } from "lucide-react";

interface ConnectionsModalProps {
  userId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isOwnProfile?: boolean;
}

export const ConnectionsModal = ({
  userId,
  open,
  onOpenChange,
  isOwnProfile = false,
}: ConnectionsModalProps) => {
  const { data: connections = [], isLoading } = useUserConnections(open ? userId : null);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Connections</DialogTitle>
          <DialogDescription>
            {isLoading
              ? "Loading connections..."
              : `${connections.length} connection${connections.length !== 1 ? "s" : ""}`}
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[60vh] space-y-1 overflow-y-auto">
          {isLoading ? (
            <p className="py-6 text-center text-sm text-muted-foreground">Loading...</p>
          ) : connections.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-8 text-center">
              <Users className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
              <p className="text-sm text-muted-foreground">No connections yet</p>
            </div>
          ) : (
            connections.map((connection) => (
              <Link
                key={connection.id}
                to={`/profile?userId=${connection.id}`}
                onClick={() => onOpenChange(false)}
                className="flex w-full items-center gap-3 rounded-lg p-2 transition-colors hover:bg-muted/60"
              >
                <UserAvatar
                  src={connection.avatar_url}
                  name={connection.full_name}
                  className="h-10 w-10 flex-shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {connection.full_name || "Unknown"}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {connection.job_title || "Tech Professional"}
                  </p>
                </div>
              </Link>
            ))
          )}
        </div>

        {isOwnProfile && (
          <Button variant="ghost" size="sm" asChild className="w-full">
            <Link to="/my-network" onClick={() => onOpenChange(false)}>
              View all in My Network
            </Link>
          </Button>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ConnectionsModal;
