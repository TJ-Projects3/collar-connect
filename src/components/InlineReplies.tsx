import { useState, type KeyboardEvent } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { ChevronDown, ChevronUp, Pencil, Trash2 } from "lucide-react";
import { usePostReplies, useUpdateReply, useDeleteReply } from "@/hooks/usePostReplies";
import { formatDistanceToNow } from "date-fns";
import { LinkifyText } from "@/components/LinkifyText";
import { useAuth } from "@/contexts/AuthContext";
import { RecruiterBadge } from "@/components/RecruiterBadge";
import { getProfileSubline, isRecruiter } from "@/lib/profile-display";

interface InlineRepliesProps {
  postId: string;
  replyCount: number;
}

const stopSpaceKeyPropagation = (e: KeyboardEvent<HTMLElement>) => {
  if (e.key === " ") e.stopPropagation();
};

export const InlineReplies = ({ postId, replyCount: initialCount }: InlineRepliesProps) => {
  const { user } = useAuth();
  const [isExpanded, setIsExpanded] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const { data: replies = [], isLoading } = usePostReplies(postId);
  const updateReply = useUpdateReply();
  const deleteReply = useDeleteReply();

  // Use live count from fetched replies, fall back to post.reply_count while loading
  const count = replies.length || initialCount || 0;

  const getInitials = (name: string | null | undefined) => {
    if (!name) return "U";
    return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  };

  if (count === 0) return null;

  const startEdit = (reply: any) => {
    setEditingId(reply.id);
    setEditValue(reply.content);
  };

  const saveEdit = (replyId: string) => {
    const content = editValue.trim();
    if (!content) return;
    updateReply.mutate(
      { replyId, postId, content },
      { onSuccess: () => setEditingId(null) }
    );
  };

  return (
    <div className="mt-2">
      <Separator className="mb-3" />

      <Button
        variant="ghost"
        size="sm"
        className="text-muted-foreground hover:text-foreground mb-2"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {isExpanded ? (
          <><ChevronUp className="h-4 w-4 mr-1" />Hide {count} {count === 1 ? "reply" : "replies"}</>
        ) : (
          <><ChevronDown className="h-4 w-4 mr-1" />View {count} {count === 1 ? "reply" : "replies"}</>
        )}
      </Button>

      {isExpanded && (
        <div className="space-y-4 mt-3">
          {isLoading ? (
            <p className="text-sm text-muted-foreground pl-4">Loading replies...</p>
          ) : (
            replies.map((reply: any) => {
              const isOwn = user?.id && reply.author_id === user.id;
              const isEditing = editingId === reply.id;
              return (
                <div key={reply.id} className="flex gap-3 pl-2">
                  <Avatar className="h-9 w-9 flex-shrink-0">
                    <AvatarImage src={reply.profiles?.avatar_url || undefined} />
                    <AvatarFallback className="bg-secondary text-secondary-foreground text-xs">
                      {getInitials(reply.profiles?.full_name)}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="bg-muted/50 rounded-lg px-3 py-2">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="font-semibold text-sm truncate">
                            {reply.profiles?.full_name || "Unknown User"}
                          </span>
                          {isRecruiter(reply.profiles) && (
                            <RecruiterBadge verified={reply.profiles?.is_verified_recruiter} compact />
                          )}
                          <span className="text-xs text-muted-foreground">•</span>
                          <span className="text-xs text-muted-foreground truncate">
                            {formatDistanceToNow(new Date(reply.created_at), { addSuffix: true })}
                          </span>
                        </div>
                        {isOwn && !isEditing && (
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-muted-foreground hover:text-foreground"
                              onClick={() => startEdit(reply)}
                              aria-label="Edit comment"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-muted-foreground hover:text-destructive"
                              onClick={() => deleteReply.mutate({ replyId: reply.id, postId })}
                              aria-label="Delete comment"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        )}
                      </div>

                      {(reply.profiles?.job_title || reply.profiles?.company || isRecruiter(reply.profiles) || reply.profiles?.major) && (
                        <p className="text-xs text-muted-foreground mb-2">
                          {getProfileSubline(reply.profiles, "")}
                        </p>
                      )}

                      {isEditing ? (
                        <div
                          className="space-y-2"
                          onKeyDownCapture={stopSpaceKeyPropagation}
                          onKeyDown={stopSpaceKeyPropagation}
                        >
                          <Textarea
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onKeyDownCapture={stopSpaceKeyPropagation}
                            onKeyDown={stopSpaceKeyPropagation}
                            className="min-h-[70px] text-sm"
                          />
                          <div className="flex justify-end gap-2">
                            <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>
                              Cancel
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => saveEdit(reply.id)}
                              disabled={updateReply.isPending || !editValue.trim()}
                            >
                              {updateReply.isPending ? "Saving..." : "Save"}
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          {reply.content && (
                            <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                              <LinkifyText>{reply.content}</LinkifyText>
                            </p>
                          )}
                          {reply.media_url && (
                            <a
                              href={reply.media_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="mt-2 inline-block"
                            >
                              <img
                                src={reply.media_url}
                                alt={reply.media_type === "gif" ? "GIF" : "Attached image"}
                                className="max-h-64 rounded-md border border-border object-cover"
                                loading="lazy"
                              />
                            </a>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};
