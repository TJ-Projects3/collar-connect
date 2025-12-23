import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp } from "lucide-react";
import { usePostReplies } from "@/hooks/usePostReplies";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

interface PostRepliesProps {
  postId: string;
  replyCount: number;
}

export const PostReplies = ({ postId, replyCount }: PostRepliesProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { data: replies = [], isLoading } = usePostReplies(postId);

  const getInitials = (name: string | null | undefined) => {
    if (!name) return "U";
    return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  };

  if (replyCount === 0) return null;

  return (
    <div className="border-t">
      <Button
        variant="ghost"
        size="sm"
        className="w-full justify-start gap-2 py-3 px-4 text-muted-foreground hover:text-foreground"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {isExpanded ? (
          <ChevronUp className="h-4 w-4" />
        ) : (
          <ChevronDown className="h-4 w-4" />
        )}
        <span className="text-sm font-medium">
          {replyCount} {replyCount === 1 ? "reply" : "replies"}
        </span>
      </Button>

      <div
        className={cn(
          "overflow-hidden transition-all duration-300 ease-in-out",
          isExpanded ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
        )}
      >
        <div className="px-4 pb-4 space-y-3">
          {isLoading ? (
            <div className="text-sm text-muted-foreground py-2">Loading replies...</div>
          ) : (
            replies.map((reply: any) => (
              <div key={reply.id} className="flex gap-3 pl-4 border-l-2 border-muted">
                <Avatar className="h-8 w-8 flex-shrink-0">
                  <AvatarImage src={reply.profiles?.avatar_url || undefined} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                    {getInitials(reply.profiles?.full_name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm">
                      {reply.profiles?.full_name || "Unknown User"}
                    </span>
                    {reply.profiles?.job_title && (
                      <span className="text-xs text-muted-foreground">
                        {reply.profiles.job_title}
                        {reply.profiles.company && ` @ ${reply.profiles.company}`}
                      </span>
                    )}
                  </div>
                  <p className="text-sm mt-1 text-foreground">{reply.content}</p>
                  <span className="text-xs text-muted-foreground mt-1 block">
                    {formatDistanceToNow(new Date(reply.created_at), { addSuffix: true })}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
