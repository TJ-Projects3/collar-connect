import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Eye, Trash2, Loader2 } from "lucide-react";
import { PostViewDialog } from "./PostViewDialog";
import { format } from "date-fns";
import { useAdminPosts, useDeletePost } from "@/hooks/useAdminPosts";

export const PostsTab = () => {
  const { data: posts = [], isLoading } = useAdminPosts();
  const deletePost = useDeletePost();

  const [viewingPost, setViewingPost] = useState<typeof posts[0] | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);

  const handleView = (post: typeof posts[0]) => {
    setViewingPost(post);
    setIsViewDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    deletePost.mutate(id);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Author</TableHead>
              <TableHead className="w-[400px]">Content</TableHead>
              <TableHead className="text-center">Likes</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {posts.map((post) => {
              const authorName = post.profiles?.full_name || "Anonymous";
              const initials = authorName.split(" ").map(n => n[0]).join("").toUpperCase();
              
              return (
                <TableRow key={post.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={post.profiles?.avatar_url || undefined} />
                        <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{authorName}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="truncate max-w-[400px] text-muted-foreground">
                      {post.content}
                    </p>
                  </TableCell>
                  <TableCell className="text-center">{post.likes}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {post.created_at && format(new Date(post.created_at), "MMM d, yyyy")}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleView(post)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(post.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
            {posts.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  No posts found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <PostViewDialog
        post={viewingPost}
        open={isViewDialogOpen}
        onOpenChange={setIsViewDialogOpen}
      />
    </div>
  );
};
