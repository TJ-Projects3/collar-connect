import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useBlockedUsers, useUnblockUser } from "@/hooks/useBlockedUsers";

const initialsOf = (name?: string | null) =>
  (name || "U").split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();

interface BlockedUsersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const BlockedUsersDialog = ({ open, onOpenChange }: BlockedUsersDialogProps) => {
  const { data: blocked = [], isLoading } = useBlockedUsers();
  const unblock = useUnblockUser();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Blocked users</DialogTitle>
          <DialogDescription>
            Blocked people can't message you and their content stays hidden from your feed.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-80 overflow-y-auto space-y-2">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : blocked.length === 0 ? (
            <p className="text-sm text-muted-foreground">You haven't blocked anyone.</p>
          ) : (
            blocked.map((row) => (
              <div key={row.id} className="flex items-center gap-3 rounded-md border p-2">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={row.profile?.avatar_url || undefined} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                    {initialsOf(row.profile?.full_name)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">
                    {row.profile?.full_name || "Unknown user"}
                  </p>
                  {row.profile?.job_title && (
                    <p className="text-xs text-muted-foreground truncate">{row.profile.job_title}</p>
                  )}
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={unblock.isPending}
                  onClick={() => unblock.mutate(row.blocked_id)}
                >
                  Unblock
                </Button>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
