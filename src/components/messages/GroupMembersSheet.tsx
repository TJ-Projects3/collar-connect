import { useMemo, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Link } from "react-router-dom";
import { LogOut, Shield, UserMinus, UserPlus, Pencil } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useMyConnections } from "@/hooks/useConnections";
import type { ConversationSummary } from "@/hooks/useMessaging";
import {
  useAddGroupParticipants,
  useLeaveGroup,
  useRemoveGroupParticipant,
  useRenameGroup,
  useSetParticipantRole,
} from "@/hooks/useGroupChat";

const initials = (name: string | null | undefined) =>
  !name ? "U" : name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

interface GroupMembersSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conversation: ConversationSummary;
  onLeft: () => void;
}

export const GroupMembersSheet = ({
  open,
  onOpenChange,
  conversation,
  onLeft,
}: GroupMembersSheetProps) => {
  const { user } = useAuth();
  const { data: connections = [] } = useMyConnections();
  const addMembers = useAddGroupParticipants();
  const removeMember = useRemoveGroupParticipant();
  const leaveGroup = useLeaveGroup();
  const setRole = useSetParticipantRole();
  const renameGroup = useRenameGroup();

  const isAdmin = conversation.my_role === "admin";
  const [renaming, setRenaming] = useState(false);
  const [title, setTitle] = useState(conversation.title ?? "");
  const [toAdd, setToAdd] = useState<string[]>([]);

  const memberIds = useMemo(
    () => new Set(conversation.participants.map((p) => p.user_id)),
    [conversation.participants]
  );

  const addable = useMemo(
    () =>
      connections
        .filter((c) => c.id !== user?.id && !memberIds.has(c.id))
        .map((c) => ({
          id: c.id,
          full_name: c.full_name ?? null,
          avatar_url: c.avatar_url ?? null,
        })),
    [connections, user?.id, memberIds]
  );

  const handleRename = async () => {
    if (!title.trim()) return;
    await renameGroup.mutateAsync({ conversationId: conversation.id, title: title.trim() });
    setRenaming(false);
  };

  const handleAdd = async () => {
    if (toAdd.length === 0) return;
    await addMembers.mutateAsync({ conversationId: conversation.id, participantIds: toAdd });
    setToAdd([]);
  };

  const handleLeave = async () => {
    await leaveGroup.mutateAsync({ conversationId: conversation.id });
    onOpenChange(false);
    onLeft();
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col gap-4 overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{conversation.title || "Group chat"}</SheetTitle>
          <SheetDescription>{conversation.participants.length} members</SheetDescription>
        </SheetHeader>

        {isAdmin && (
          <div className="space-y-2">
            {renaming ? (
              <div className="flex gap-2">
                <Input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={80} />
                <Button size="sm" onClick={handleRename} disabled={renameGroup.isPending}>
                  Save
                </Button>
              </div>
            ) : (
              <Button variant="outline" size="sm" onClick={() => setRenaming(true)}>
                <Pencil className="mr-2 h-4 w-4" />
                Rename group
              </Button>
            )}
          </div>
        )}

        <Separator />

        <div className="space-y-1">
          {conversation.participants.map((p) => (
            <div key={p.user_id} className="flex items-center gap-3 rounded-md p-2 hover:bg-muted/50">
              <Link to={`/profile?userId=${p.user_id}`}>
                <Avatar className="h-9 w-9">
                  <AvatarImage src={p.profile?.avatar_url || undefined} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                    {initials(p.profile?.full_name)}
                  </AvatarFallback>
                </Avatar>
              </Link>
              <div className="min-w-0 flex-1">
                <Link
                  to={`/profile?userId=${p.user_id}`}
                  className="block truncate text-sm font-medium hover:underline"
                >
                  {p.profile?.full_name || "Unknown"}
                  {p.user_id === user?.id ? " (you)" : ""}
                </Link>
              </div>
              {p.role === "admin" && (
                <Badge variant="secondary" className="shrink-0">
                  Admin
                </Badge>
              )}
              {isAdmin && p.user_id !== user?.id && (
                <div className="flex shrink-0 gap-1">
                  {p.role !== "admin" && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      aria-label="Make admin"
                      onClick={() =>
                        setRole.mutate({
                          conversationId: conversation.id,
                          userId: p.user_id,
                          role: "admin",
                        })
                      }
                    >
                      <Shield className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive"
                    aria-label="Remove member"
                    onClick={() =>
                      removeMember.mutate({ conversationId: conversation.id, userId: p.user_id })
                    }
                  >
                    <UserMinus className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>

        {isAdmin && (
          <>
            <Separator />
            <div className="space-y-2">
              <p className="text-sm font-medium">Add connections</p>
              {addable.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  All of your connections are already in this group.
                </p>
              ) : (
                <>
                  <ScrollArea className="h-48 rounded-md border">
                    <div className="p-1">
                      {addable.map((o) => (
                        <button
                          key={o.id}
                          type="button"
                          className="flex w-full items-center gap-3 rounded-md p-2 text-left hover:bg-muted/60"
                          onClick={() =>
                            setToAdd((prev) =>
                              prev.includes(o.id) ? prev.filter((id) => id !== o.id) : [...prev, o.id]
                            )
                          }
                        >
                          <Checkbox checked={toAdd.includes(o.id)} className="pointer-events-none" />
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={o.avatar_url || undefined} />
                            <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                              {initials(o.full_name)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="truncate text-sm">{o.full_name || "Unknown"}</span>
                        </button>
                      ))}
                    </div>
                  </ScrollArea>
                  <Button
                    size="sm"
                    onClick={handleAdd}
                    disabled={toAdd.length === 0 || addMembers.isPending}
                  >
                    <UserPlus className="mr-2 h-4 w-4" />
                    Add {toAdd.length > 0 ? `(${toAdd.length})` : ""}
                  </Button>
                </>
              )}
            </div>
          </>
        )}

        <Separator />

        <Button
          variant="outline"
          className="text-destructive"
          onClick={handleLeave}
          disabled={leaveGroup.isPending}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Leave group
        </Button>
      </SheetContent>
    </Sheet>
  );
};
