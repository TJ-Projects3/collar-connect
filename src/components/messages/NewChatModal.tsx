import { useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { X, Users } from "lucide-react";
import { useMyConnections } from "@/hooks/useConnections";
import { useAuth } from "@/contexts/AuthContext";
import { useCreateGroupConversation } from "@/hooks/useGroupChat";

interface Option {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  job_title: string | null;
}

const initials = (name: string | null | undefined) =>
  !name ? "U" : name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

interface NewChatModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStartDirect: (recipientId: string) => void;
  onGroupCreated: (conversationId: string) => void;
}

export const NewChatModal = ({ open, onOpenChange, onStartDirect, onGroupCreated }: NewChatModalProps) => {
  const { user } = useAuth();
  const { data: connections = [], isLoading } = useMyConnections();
  const createGroup = useCreateGroupConversation();
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Option[]>([]);
  const [groupName, setGroupName] = useState("");

  const options = useMemo<Option[]>(() => {
    const list: Option[] = connections
      .filter((c) => c.id !== user?.id)
      .map((c) => ({
        id: c.id,
        full_name: c.full_name ?? null,
        avatar_url: c.avatar_url ?? null,
        job_title: c.job_title ?? null,
      }));
    const q = search.trim().toLowerCase();
    return list.filter((o) => !q || (o.full_name ?? "").toLowerCase().includes(q));
  }, [connections, user?.id, search]);

  const toggle = (option: Option) => {
    setSelected((prev) =>
      prev.some((p) => p.id === option.id)
        ? prev.filter((p) => p.id !== option.id)
        : [...prev, option]
    );
  };

  const reset = () => {
    setSearch("");
    setSelected([]);
    setGroupName("");
  };

  const isGroup = selected.length >= 2;

  const handleSubmit = async () => {
    if (selected.length === 0) return;

    if (!isGroup) {
      onStartDirect(selected[0].id);
      reset();
      onOpenChange(false);
      return;
    }

    const conversationId = await createGroup.mutateAsync({
      title: groupName.trim(),
      participantIds: selected.map((s) => s.id),
    });
    if (conversationId) {
      onGroupCreated(conversationId);
      reset();
      onOpenChange(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) reset();
        onOpenChange(next);
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New message</DialogTitle>
          <DialogDescription>
            Pick one person for a direct chat, or two or more to start a group.
          </DialogDescription>
        </DialogHeader>

        {selected.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {selected.map((s) => (
              <Badge key={s.id} variant="secondary" className="gap-1 pr-1">
                {s.full_name || "Unknown"}
                <button
                  type="button"
                  onClick={() => toggle(s)}
                  className="rounded-full p-0.5 hover:bg-muted"
                  aria-label={`Remove ${s.full_name ?? "person"}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}

        {isGroup && (
          <div className="space-y-1">
            <label className="text-sm font-medium" htmlFor="group-name">
              Group name
            </label>
            <Input
              id="group-name"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="e.g. Spring Internship Crew"
              maxLength={80}
            />
          </div>
        )}

        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search your connections"
        />

        <ScrollArea className="h-64 rounded-md border">
          <div className="p-1">
            {isLoading ? (
              <p className="p-4 text-sm text-muted-foreground">Loading connections...</p>
            ) : options.length === 0 ? (
              <p className="p-4 text-sm text-muted-foreground">
                No connections found. Connect with people first to start a chat.
              </p>
            ) : (
              options.map((o) => {
                const checked = selected.some((s) => s.id === o.id);
                return (
                  <button
                    key={o.id}
                    type="button"
                    onClick={() => toggle(o)}
                    className="flex w-full items-center gap-3 rounded-md p-2 text-left hover:bg-muted/60"
                  >
                    <Checkbox checked={checked} className="pointer-events-none" />
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={o.avatar_url || undefined} />
                      <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                        {initials(o.full_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{o.full_name || "Unknown"}</p>
                      {o.job_title && (
                        <p className="truncate text-xs text-muted-foreground">{o.job_title}</p>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </ScrollArea>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={
              selected.length === 0 ||
              createGroup.isPending ||
              (isGroup && groupName.trim().length === 0)
            }
          >
            {isGroup ? (
              <>
                <Users className="mr-2 h-4 w-4" />
                Create group
              </>
            ) : (
              "Start chat"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
