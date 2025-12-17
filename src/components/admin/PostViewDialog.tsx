import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format } from "date-fns";

interface Post {
  id: string;
  content: string;
  likes: number | null;
  created_at: string | null;
  profiles?: {
    full_name: string | null;
    avatar_url: string | null;
  } | null;
}

interface PostViewDialogProps {
  post: Post | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const PostViewDialog = ({ post, open, onOpenChange }: PostViewDialogProps) => {
  if (!post) return null;

  const authorName = post.profiles?.full_name || "Anonymous";
  const initials = authorName.split(" ").map(n => n[0]).join("").toUpperCase();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Post Details</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarImage src={post.profiles?.avatar_url || undefined} />
              <AvatarFallback className="bg-primary text-primary-foreground">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{authorName}</p>
              {post.created_at && (
                <p className="text-sm text-muted-foreground">
                  {format(new Date(post.created_at), "PPp")}
                </p>
              )}
            </div>
          </div>
          <div className="p-4 bg-muted rounded-lg">
            <p className="whitespace-pre-wrap">{post.content}</p>
          </div>
          <div className="text-sm text-muted-foreground">
            {post.likes ?? 0} likes
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
