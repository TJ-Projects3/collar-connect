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
import { Eye, Trash2 } from "lucide-react";
import { PostViewDialog } from "./PostViewDialog";
import { format } from "date-fns";

// Mock data for frontend development
const mockPosts = [
  {
    id: "1",
    content: "Just attended an amazing diversity and inclusion workshop. The insights on unconscious bias were eye-opening. Highly recommend everyone to participate in similar events!",
    likes: 24,
    created_at: "2024-01-18T14:30:00Z",
    profiles: {
      full_name: "Sarah Johnson",
      avatar_url: null,
    },
  },
  {
    id: "2",
    content: "Excited to announce that our company just launched a new mentorship program for underrepresented groups in tech. If you're interested in being a mentor or mentee, reach out!",
    likes: 56,
    created_at: "2024-01-17T09:15:00Z",
    profiles: {
      full_name: "Michael Chen",
      avatar_url: null,
    },
  },
  {
    id: "3",
    content: "Looking for recommendations on D&I training resources for our team. What has worked well for your organizations?",
    likes: 12,
    created_at: "2024-01-16T16:45:00Z",
    profiles: {
      full_name: "Emily Rodriguez",
      avatar_url: null,
    },
  },
];

export const PostsTab = () => {
  const [posts, setPosts] = useState(mockPosts);
  const [viewingPost, setViewingPost] = useState<typeof mockPosts[0] | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);

  const handleView = (post: typeof mockPosts[0]) => {
    setViewingPost(post);
    setIsViewDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    setPosts(posts.filter(p => p.id !== id));
  };

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
