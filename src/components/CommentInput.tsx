import { useState, KeyboardEvent } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";
import { useProfile } from "@/hooks/useProfile";
import { useCreateReply } from "@/hooks/usePostReplies";

interface CommentInputProps {
  postId: string;
}

export const CommentInput = ({ postId }: CommentInputProps) => {
  const { data: profile } = useProfile();
  const [value, setValue] = useState("");
  const createReply = useCreateReply();

  const initials = (profile?.full_name || "U")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const submit = () => {
    const content = value.trim();
    if (!content || createReply.isPending) return;
    createReply.mutate(
      { postId, content },
      { onSuccess: () => setValue("") }
    );
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  return (
    <div className="flex items-center gap-2 pt-1">
      <Avatar className="h-8 w-8 flex-shrink-0">
        <AvatarImage src={profile?.avatar_url || undefined} />
        <AvatarFallback className="bg-primary text-primary-foreground text-xs">
          {initials}
        </AvatarFallback>
      </Avatar>
      <div className="relative flex-1">
        <Input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Write a comment..."
          className="h-9 rounded-full bg-muted/40 border-muted-foreground/20 pr-10 text-sm"
          disabled={createReply.isPending}
        />
        {value.trim().length > 0 && (
          <Button
            type="button"
            size="icon"
            variant="ghost"
            onClick={submit}
            disabled={createReply.isPending}
            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-primary hover:bg-primary/10"
            aria-label="Post comment"
          >
            <Send className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
};
