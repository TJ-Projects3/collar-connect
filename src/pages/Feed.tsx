import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Home, Users, Briefcase, MessageSquare,
  Settings, ThumbsUp, MessageCircle, Share2,
  TrendingUp, Sparkles, BookOpen, Calendar, Trash2, FileText, Video, Download, Globe, Hash
} from "lucide-react";
import { useFeaturedResources } from "@/hooks/useFeaturedResources";
import { useTrendingHashtags } from "@/hooks/useTrendingHashtags";
import { Link } from "react-router-dom";
import { CreatePostModal } from "@/components/CreatePostModal";
import { ReplyModal } from "@/components/ReplyModal";
import { ShareDialog } from "@/components/ShareDialog";
import { InlineReplies } from "@/components/InlineReplies";
import { Navbar } from "@/components/Navbar";
import { usePosts, useDeletePost } from "@/hooks/usePosts";
import { usePostLikes, useToggleLike } from "@/hooks/usePostLikes";
import { useAuth } from "@/contexts/AuthContext";

import { formatDistanceToNow } from "date-fns";

const Feed = () => {
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [replyModalState, setReplyModalState] = useState<{
    isOpen: boolean;
    postId: string;
    postContent: string;
    postAuthor: string;
  }>({
    isOpen: false,
    postId: "",
    postContent: "",
    postAuthor: "",
  });
  const [shareDialogState, setShareDialogState] = useState<{
    isOpen: boolean;
    postId: string;
  }>({
    isOpen: false,
    postId: "",
  });
  const { data: posts, isLoading } = usePosts();

  const { data: featuredResources, isLoading: featuredLoading } = useFeaturedResources(3);
  const { data: trendingHashtags, isLoading: trendingLoading } = useTrendingHashtags(5);

  const resourceIcon = (type: string) => {
    switch (type) {
      case "article": return <FileText className="h-5 w-5 text-primary" />;
      case "video": return <Video className="h-5 w-5 text-accent" />;
      case "download": return <Download className="h-5 w-5 text-secondary" />;
      case "website": return <Globe className="h-5 w-5 text-primary" />;
      default: return <Sparkles className="h-5 w-5 text-primary" />;
    }
  };

  const getInitials = (name: string | null) => {
    if (!name) return "U";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const handleReplyClick = (postId: string, content: string, authorName: string) => {
    setReplyModalState({
      isOpen: true,
      postId,
      postContent: content,
      postAuthor: authorName,
    });
  };

  const handleShareClick = (postId: string) => {
    setShareDialogState({
      isOpen: true,
      postId,
    });
  };

  const PostCard = ({ post }: { post: any }) => {
    const { user } = useAuth();
    const toggleLike = useToggleLike();
    const deletePost = useDeletePost();
    const { data: likesData } = usePostLikes(post.id);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const handleLike = () => {
      toggleLike.mutate({
        postId: post.id,
        hasLiked: likesData?.hasLiked || false,
      });
    };

    const handleDeleteClick = () => {
      setShowDeleteConfirm(true);
    };

    const handleConfirmDelete = () => {
      deletePost.mutate(post.id);
      setShowDeleteConfirm(false);
    };

    const isOwnPost = user?.id === post.author_id;

    return (
      <Card key={post.id}>
        <CardHeader>
          <div className="flex items-start justify-between">
            <Link to={`/profile?userId=${post.author_id}`} className="flex gap-3">
              <Avatar className="cursor-pointer">
                <AvatarImage src={post.profiles?.avatar_url || undefined} />
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {getInitials(post.profiles?.full_name)}
                </AvatarFallback>
              </Avatar>
              <div className="cursor-pointer">
                <h3 className="font-semibold">{post.profiles?.full_name || "Unknown User"}</h3>
                <p className="text-sm text-muted-foreground">
                  {[post.profiles?.job_title, post.profiles?.company].filter(Boolean).join(" @ ") || "Member"}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {post.created_at && formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                </p>
              </div>
            </Link>
            {isOwnPost && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleDeleteClick}
                className="text-muted-foreground hover:text-destructive hover:bg-muted/50"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-foreground leading-relaxed whitespace-pre-wrap">{post.content}</p>

          {/* Inline Replies */}
          <InlineReplies postId={post.id} replyCount={post.reply_count || 0} />
        </CardContent>
        <CardFooter className="flex items-center justify-between border-t pt-3">
          <Button
            variant="ghost"
            size="sm"
            className={`gap-2 ${likesData?.hasLiked ? "text-primary" : ""}`}
            onClick={handleLike}
            disabled={toggleLike.isPending}
          >
            <ThumbsUp className={`h-4 w-4 ${likesData?.hasLiked ? "fill-current" : ""}`} />
            <span>{likesData?.likeCount || 0}</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="gap-2"
            onClick={() => handleReplyClick(post.id, post.content, post.profiles?.full_name || "Unknown User")}
          >
            <MessageCircle className="h-4 w-4" />
            <span>{post.reply_count || 0}</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="gap-2"
            onClick={() => handleShareClick(post.id)}
          >
            <Share2 className="h-4 w-4" />
            <span>Share</span>
          </Button>
        </CardFooter>

        <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Post</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this post? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleConfirmDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Sidebar */}
          <aside className="lg:col-span-3">
            <Card className="sticky top-20">
              <CardContent className="p-4 space-y-1">
                <Button variant="ghost" className="w-full justify-start gap-3">
                  <Home className="h-5 w-5" />
                  <span>Home</span>
                </Button>
                <Button variant="ghost" className="w-full justify-start gap-3" asChild>
                  <Link to="/my-network">
                    <Users className="h-5 w-5" />
                    <span>My Network</span>
                  </Link>
                </Button>
                <Button variant="ghost" className="w-full justify-start gap-3" asChild>
                  <Link to="/jobs">
                    <Briefcase className="h-5 w-5" />
                    <span>Jobs</span>
                  </Link>
                </Button>
                <Button variant="ghost" className="w-full justify-start gap-3" asChild>
                  <Link to="/messages">
                    <MessageSquare className="h-5 w-5" />
                    <span>Messaging</span>
                  </Link>
                </Button>
                <Button variant="ghost" className="w-full justify-start gap-3" asChild>
                  <Link to="/content-hub">
                    <BookOpen className="h-5 w-5" />
                    <span>Content Hub</span>
                  </Link>
                </Button>
                <Button variant="ghost" className="w-full justify-start gap-3" asChild>
                  <Link to="/calendar">
                    <Calendar className="h-5 w-5" />
                    <span>Calendar</span>
                  </Link>
                </Button>
                <Separator className="my-2" />
                <Button variant="ghost" className="w-full justify-start gap-3" asChild>
                  <Link to="/settings">
                    <Settings className="h-5 w-5" />
                    <span>Settings</span>
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </aside>

          {/* Main Feed */}
          <main className="lg:col-span-6 space-y-4">
            {/* Create Post */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex gap-3">
                  <Link to="/profile">
                    <Avatar className="cursor-pointer">
                      <AvatarFallback className="bg-primary text-primary-foreground">ME</AvatarFallback>
                    </Avatar>
                  </Link>
                  <Textarea
                    placeholder="Share your thoughts on diversity and inclusion in tech..."
                    className="min-h-[80px]"
                    onFocus={() => setIsPostModalOpen(true)}
                    readOnly
                  />
                </div>
              </CardHeader>
              <CardFooter className="pt-0">
                <Button className="ml-auto" onClick={() => setIsPostModalOpen(true)}>Post</Button>
              </CardFooter>
            </Card>

            <CreatePostModal open={isPostModalOpen} onOpenChange={setIsPostModalOpen} />

            {/* Posts Feed */}
            {isLoading ? (
              <Card>
                <CardContent className="p-6 text-center text-muted-foreground">
                  Loading posts...
                </CardContent>
              </Card>
            ) : posts && posts.length > 0 ? (
              posts.map((post) => <PostCard key={post.id} post={post} />)
            ) : (
              <Card>
                <CardContent className="p-6 text-center text-muted-foreground">
                  No posts yet. Be the first to share something!
                </CardContent>
              </Card>
            )}
          </main>

          {/* Right Sidebar */}
          <aside className="lg:col-span-3 space-y-4">
            {/* Featured Resources */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">Featured</h3>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {featuredLoading ? (
                  <p className="text-xs text-muted-foreground">Loading...</p>
                ) : featuredResources && featuredResources.length > 0 ? (
                  featuredResources.map((r) => (
                    <a
                      key={r.id}
                      href={r.external_url || "#"}
                      target={r.external_url ? "_blank" : undefined}
                      rel="noopener noreferrer"
                      className="flex gap-3 items-start hover:bg-muted/50 p-2 rounded-md transition-colors -mx-2"
                    >
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        {resourceIcon(r.resource_type)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{r.title}</p>
                        <p className="text-xs text-muted-foreground truncate">{r.description || r.resource_type}</p>
                      </div>
                    </a>
                  ))
                ) : (
                  <p className="text-xs text-muted-foreground">No featured resources yet.</p>
                )}
              </CardContent>
            </Card>

            {/* Trending Hashtags */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">Trending</h3>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {trendingLoading ? (
                  <p className="text-xs text-muted-foreground">Loading...</p>
                ) : trendingHashtags && trendingHashtags.length > 0 ? (
                  trendingHashtags.map((item) => (
                    <div key={item.hashtag} className="cursor-pointer hover:bg-muted/50 p-2 rounded-md transition-colors -mx-2">
                      <p className="font-medium text-sm flex items-center gap-1.5">
                        <Hash className="h-3.5 w-3.5 text-muted-foreground" />
                        {item.hashtag}
                      </p>
                      <p className="text-xs text-muted-foreground ml-5">
                        {item.post_count} {item.post_count === 1 ? "post" : "posts"} this week
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-muted-foreground">No trending topics yet. Try using #hashtags in your posts!</p>
                )}
              </CardContent>
            </Card>
          </aside>
        </div>
      </div>

      {/* Modals */}
      <ReplyModal
        open={replyModalState.isOpen}
        onOpenChange={(open) => setReplyModalState({ ...replyModalState, isOpen: open })}
        postId={replyModalState.postId}
        postContent={replyModalState.postContent}
        postAuthor={replyModalState.postAuthor}
      />
      <ShareDialog
        open={shareDialogState.isOpen}
        onOpenChange={(open) => setShareDialogState({ ...shareDialogState, isOpen: open })}
        postId={shareDialogState.postId}
      />
    </div>
  );
};

export default Feed;
