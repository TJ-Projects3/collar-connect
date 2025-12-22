import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { 
  Home, Users, Briefcase, MessageSquare, 
  Settings, ThumbsUp, MessageCircle, Share2, 
  TrendingUp, Award, Sparkles, BookOpen, Calendar, Send, ChevronDown, ChevronUp
} from "lucide-react";
import { Link } from "react-router-dom";
import { CreatePostModal } from "@/components/CreatePostModal";
import { ShareDialog } from "@/components/ShareDialog";
import { Navbar } from "@/components/Navbar";
import { usePosts } from "@/hooks/usePosts";
import { usePostLikes, useToggleLike } from "@/hooks/usePostLikes";
import { usePostReplies, useCreateReply } from "@/hooks/usePostReplies";
import { useProfile } from "@/hooks/useProfile";

import { formatDistanceToNow } from "date-fns";

const Feed = () => {
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [shareDialogState, setShareDialogState] = useState<{
    isOpen: boolean;
    postId: string;
  }>({
    isOpen: false,
    postId: "",
  });
  const { data: posts, isLoading } = usePosts();

  const trendingTopics = [
    { topic: "Diversity in Tech", posts: "1.2K posts" },
    { topic: "Inclusive Leadership", posts: "856 posts" },
    { topic: "Tech Mentorship", posts: "2.1K posts" },
    { topic: "Career Growth", posts: "3.4K posts" }
  ];

  const getInitials = (name: string | null) => {
    if (!name) return "U";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const handleShareClick = (postId: string) => {
    setShareDialogState({
      isOpen: true,
      postId,
    });
  };

  const PostCard = ({ post }: { post: any }) => {
    const toggleLike = useToggleLike();
    const { data: likesData } = usePostLikes(post.id);
    const { data: replies } = usePostReplies(post.id);
    const createReply = useCreateReply();
    const { data: profile } = useProfile();
    const [showReplies, setShowReplies] = useState(false);
    const [replyContent, setReplyContent] = useState("");

    const handleLike = () => {
      toggleLike.mutate({
        postId: post.id,
        hasLiked: likesData?.hasLiked || false,
      });
    };

    const handleSubmitReply = async () => {
      if (!replyContent.trim()) return;
      
      await createReply.mutateAsync({
        postId: post.id,
        content: replyContent.trim(),
      });
      setReplyContent("");
    };

    const replyCount = post.reply_count || 0;

    return (
      <Card key={post.id}>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex gap-3">
              <Avatar>
                {post.profiles?.avatar_url ? (
                  <AvatarImage src={post.profiles.avatar_url} />
                ) : (
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {getInitials(post.profiles?.full_name)}
                  </AvatarFallback>
                )}
              </Avatar>
              <div>
                <h3 className="font-semibold">{post.profiles?.full_name || "Unknown User"}</h3>
                <p className="text-sm text-muted-foreground">
                  {[post.profiles?.job_title, post.profiles?.company].filter(Boolean).join(" @ ") || "Member"}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {post.created_at && formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                </p>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-foreground leading-relaxed whitespace-pre-wrap">{post.content}</p>
        </CardContent>
        <CardFooter className="flex flex-col gap-3 border-t pt-3">
          <div className="flex items-center justify-between w-full">
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
              onClick={() => setShowReplies(!showReplies)}
            >
              <MessageCircle className="h-4 w-4" />
              <span>{replyCount}</span>
              {replyCount > 0 && (showReplies ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
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
          </div>

          {/* Inline Reply Input */}
          {showReplies && (
            <div className="w-full space-y-3">
              <div className="flex gap-2 items-start">
                <Avatar className="h-8 w-8">
                  {profile?.avatar_url ? (
                    <AvatarImage src={profile.avatar_url} />
                  ) : (
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                      {getInitials(profile?.full_name || null)}
                    </AvatarFallback>
                  )}
                </Avatar>
                <div className="flex-1 flex gap-2">
                  <Textarea
                    placeholder="Write a reply..."
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    className="min-h-[40px] resize-none text-sm"
                    rows={1}
                  />
                  <Button
                    size="sm"
                    onClick={handleSubmitReply}
                    disabled={!replyContent.trim() || createReply.isPending}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Replies List */}
              {replies && replies.length > 0 && (
                <div className="space-y-3 pl-10">
                  {replies.map((reply: any) => (
                    <div key={reply.id} className="flex gap-2">
                      <Avatar className="h-8 w-8">
                        {reply.profiles?.avatar_url ? (
                          <AvatarImage src={reply.profiles.avatar_url} />
                        ) : (
                          <AvatarFallback className="bg-muted text-muted-foreground text-xs">
                            {getInitials(reply.profiles?.full_name || null)}
                          </AvatarFallback>
                        )}
                      </Avatar>
                      <div className="flex-1 bg-muted/50 rounded-lg p-2">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm">
                            {reply.profiles?.full_name || "Unknown User"}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {reply.created_at && formatDistanceToNow(new Date(reply.created_at), { addSuffix: true })}
                          </span>
                        </div>
                        <p className="text-sm text-foreground mt-1">{reply.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </CardFooter>
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
                <Button variant="ghost" className="w-full justify-start gap-3">
                  <Users className="h-5 w-5" />
                  <span>My Network</span>
                </Button>
                <Button variant="ghost" className="w-full justify-start gap-3">
                  <Briefcase className="h-5 w-5" />
                  <span>Jobs</span>
                </Button>
                <Button variant="ghost" className="w-full justify-start gap-3">
                  <MessageSquare className="h-5 w-5" />
                  <span>Messaging</span>
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
                <Button variant="ghost" className="w-full justify-start gap-3">
                  <Settings className="h-5 w-5" />
                  <span>Settings</span>
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
            {/* Featured */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">Featured</h3>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex gap-3 items-start">
                  <div className="w-10 h-10 rounded-full bg-secondary/20 flex items-center justify-center flex-shrink-0">
                    <Award className="h-5 w-5 text-secondary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Diversity Awards 2025</p>
                    <p className="text-xs text-muted-foreground">Nominations open</p>
                  </div>
                </div>
                <div className="flex gap-3 items-start">
                  <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
                    <Users className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Tech Inclusion Summit</p>
                    <p className="text-xs text-muted-foreground">March 15-17, 2025</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Trending Topics */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">Trending Topics</h3>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {trendingTopics.map((item, index) => (
                  <div key={index} className="cursor-pointer hover:bg-muted/50 p-2 rounded-md transition-colors">
                    <p className="font-medium text-sm">#{item.topic}</p>
                    <p className="text-xs text-muted-foreground">{item.posts}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </aside>
        </div>
      </div>

      {/* Modals */}
      <ShareDialog
        open={shareDialogState.isOpen}
        onOpenChange={(open) => setShareDialogState({ ...shareDialogState, isOpen: open })}
        postId={shareDialogState.postId}
      />
    </div>
  );
};

export default Feed;
