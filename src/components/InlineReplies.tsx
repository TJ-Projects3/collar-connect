import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ChevronDown, ChevronUp } from "lucide-react";
import { usePostReplies } from "@/hooks/usePostReplies";
import { formatDistanceToNow } from "date-fns";

interface InlineRepliesProps {
  postId: string;
  replyCount: number;
}

export const InlineReplies = ({ postId, replyCount }: InlineRepliesProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { data: replies = [], isLoading } = usePostReplies(postId);

  const getInitials = (name: string | null | undefined) => {
    if (!name) return "U";
    return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  };

  if (replyCount === 0) return null;

  return (
    <div className="mt-2">
      <Separator className="mb-3" />

      {/* Toggle Button */}
      <Button
        variant="ghost"
        size="sm"
        className="text-muted-foreground hover:text-foreground mb-2"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {isExpanded ? (
          <>
            <ChevronUp className="h-4 w-4 mr-1" />
            Hide {replyCount} {replyCount === 1 ? "reply" : "replies"}
          </>
        ) : (
          <>
            <ChevronDown className="h-4 w-4 mr-1" />
            View {replyCount} {replyCount === 1 ? "reply" : "replies"}
          </>
        )}
      </Button>

      {/* Replies List */}
      {isExpanded && (
        <div className="space-y-4 mt-3">
          {isLoading ? (
            <p className="text-sm text-muted-foreground pl-4">Loading replies...</p>
          ) : (
            replies.map((reply: any) => (
              <div key={reply.id} className="flex gap-3 pl-2">
                <Avatar className="h-9 w-9 flex-shrink-0">
                  <AvatarImage src={reply.profiles?.avatar_url || undefined} />
                  <AvatarFallback className="bg-secondary text-secondary-foreground text-xs">
                    {getInitials(reply.profiles?.full_name)}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  {/* Reply Header */}
                  <div className="bg-muted/50 rounded-lg px-3 py-2">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-sm">
                        {reply.profiles?.full_name || "Unknown User"}
                      </span>
                      <span className="text-xs text-muted-foreground">•</span>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(reply.created_at), { addSuffix: true })}
                      </span>
                    </div>

                    {/* Job Title & Company */}
                    {(reply.profiles?.job_title || reply.profiles?.company) && (
                      <p className="text-xs text-muted-foreground mb-2">
                        {[reply.profiles?.job_title, reply.profiles?.company]
                          .filter(Boolean)
                          .join(" @ ")}
                      </p>
                    )}

                    {/* Reply Content */}
                    <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                      {reply.content}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
