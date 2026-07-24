import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
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
  TrendingUp, Sparkles, BookOpen, Calendar, Trash2, FileText, Video, Download, Globe, Hash, Compass
} from "lucide-react";
import { useFeaturedResources } from "@/hooks/useFeaturedResources";
import { useTrendingHashtags } from "@/hooks/useTrendingHashtags";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { CreatePostModal } from "@/components/CreatePostModal";
import { ReplyModal } from "@/components/ReplyModal";
import { ShareDialog } from "@/components/ShareDialog";
import { InlineReplies } from "@/components/InlineReplies";
import { Navbar } from "@/components/Navbar";
import { usePosts, useDeletePost } from "@/hooks/usePosts";
import { LinkifyText } from "@/components/LinkifyText";
import { usePostLikes, useToggleLike } from "@/hooks/usePostLikes";
import { usePostReplies } from "@/hooks/usePostReplies";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";

import { formatDistanceToNow } from "date-fns";
import { ReactionPicker, REACTIONS, reactionMeta } from "@/components/ReactionPicker";
import { CommentInput } from "@/components/CommentInput";
import { renderPostContent } from "@/lib/post-formatting";
import { RecruiterBadge } from "@/components/RecruiterBadge";
import { getProfileSubline } from "@/lib/profile-display";

const SUGGESTED_HASHTAGS = ["DiversityInTech", "Cybersecurity", "Internships", "CareerMapping"];

const ROTATING_PLACEHOLDERS = [
  "Share your thoughts on career growth...",
  "What's happening in your industry?",
  "Ask about a job or hiring trend...",
  "Share a recruiting tip or insight...",
  "Discuss a new technology...",
  "Share your career wins and milestones...",
  "What skills are in demand right now?",
  "Talk about diversity in tech hiring...",
  "Share internship or entry-level advice...",
  "Discuss the future of work in tech...",
];

const Feed = () => {
  const { data: profile } = useProfile();
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [postInitialContent, setPostInitialContent] = useState<string>("");
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [activeHashtag, setActiveHashtag] = useState<string | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % ROTATING_PLACEHOLDERS.length);
    }, 3500);
    return () => clearInterval(interval);
  }, []);
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

  const filteredPosts = activeHashtag && posts
    ? posts.filter((p) => {
        const regex = new RegExp(`#${activeHashtag}\\b`, "i");
        return regex.test(p.content);
      })
    : posts;

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
    const { data: repliesData } = usePostReplies(post.id);
    const liveReplyCount = repliesData?.length ?? post.reply_count ?? 0;
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const handleQuickToggle = () => {
      toggleLike.mutate({
        postId: post.id,
        hasLiked: likesData?.hasLiked || false,
        reaction: likesData?.userReaction ?? "like",
        currentReaction: likesData?.userReaction ?? null,
      });
    };

    const handleSelectReaction = (reaction: any) => {
      toggleLike.mutate({
        postId: post.id,
        hasLiked: likesData?.hasLiked || false,
        reaction,
        currentReaction: likesData?.userReaction ?? null,
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

    // Top 3 reaction types present, ordered by count desc
    const topReactionTypes = likesData
      ? (Object.entries(likesData.breakdown) as [any, number][])
          .filter(([, n]) => n > 0)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .map(([type]) => type)
      : [];

    return (
      <Card key={post.id}>
        <CardHeader className="px-6 pt-6 pb-3 md:px-8 md:pt-7">
          <div className="flex items-start justify-between">
            <Link to={`/profile?userId=${post.author_id}`} className="flex gap-3">
              <Avatar className="cursor-pointer">
                <AvatarImage src={post.profiles?.avatar_url || undefined} />
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {getInitials(post.profiles?.full_name)}
                </AvatarFallback>
              </Avatar>
              <div className="cursor-pointer">
                <h3 className="font-semibold flex items-center gap-2 flex-wrap">
                  <span>{post.profiles?.full_name || "Unknown User"}</span>
                  {post.profiles?.profile_type === "recruiter" && (
                    <RecruiterBadge verified={post.profiles?.is_verified_recruiter} />
                  )}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {getProfileSubline(post.profiles)}
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
        <CardContent className="px-6 pb-3 md:px-8">
          <div className="text-foreground text-[15px]">{renderPostContent(post.content)}</div>

          {(post as any).media_url && (
            <a
              href={(post as any).media_url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 block"
            >
              <img
                src={(post as any).media_url}
                alt={(post as any).media_type === "gif" ? "GIF attachment" : "Post image"}
                className="max-h-[520px] w-auto rounded-md border border-border object-contain"
                loading="lazy"
              />
            </a>
          )}

          {/* Inline Replies */}
          <InlineReplies postId={post.id} replyCount={liveReplyCount} />
        </CardContent>

        <CardFooter className="flex flex-col items-stretch gap-2 border-t pt-3 px-6 pb-5 md:px-8">
          {/* Reaction summary + counts */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            {likesData && likesData.likeCount > 0 ? (
              <Popover>
                <PopoverTrigger asChild>
                  <button className="flex items-center gap-1.5 hover:text-primary hover:underline">
                    <span className="flex -space-x-1">
                      {topReactionTypes.map((t) => {
                        const meta = reactionMeta(t);
                        const Icon = meta.Icon;
                        return (
                          <span
                            key={t}
                            className={`inline-flex h-4 w-4 items-center justify-center rounded-full bg-background ring-1 ring-border ${meta.colorClass}`}
                          >
                            <Icon className="h-2.5 w-2.5 fill-current" />
                          </span>
                        );
                      })}
                    </span>
                    <span>
                      {(() => {
                        const names = likesData.likes
                          .map((l) => l.profile?.full_name)
                          .filter(Boolean) as string[];
                        if (names.length === 0) return likesData.likeCount;
                        if (names.length === 1) return names[0];
                        if (names.length === 2) return `${names[0]} and ${names[1]}`;
                        return `${names[0]}, ${names[1]} and ${names.length - 2} other${names.length - 2 === 1 ? "" : "s"}`;
                      })()}
                    </span>
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-64 p-2">
                  <p className="text-sm font-semibold px-2 py-1">Reactions</p>
                  <div className="max-h-64 overflow-y-auto">
                    {likesData.likes.map((like) => {
                      const meta = reactionMeta(like.reaction_type);
                      const Icon = meta.Icon;
                      return (
                        <Link
                          key={like.user_id}
                          to={`/profile?userId=${like.user_id}`}
                          className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-muted/50"
                        >
                          <Avatar className="h-7 w-7">
                            <AvatarImage src={like.profile?.avatar_url || undefined} />
                            <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                              {getInitials(like.profile?.full_name || null)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm truncate flex-1">{like.profile?.full_name || "Unknown user"}</span>
                          <Icon className={`h-3.5 w-3.5 fill-current ${meta.colorClass}`} />
                        </Link>
                      );
                    })}
                  </div>
                </PopoverContent>
              </Popover>
            ) : <span />}
            <div className="flex items-center gap-3">
              <span>{liveReplyCount} {liveReplyCount === 1 ? "comment" : "comments"}</span>
            </div>
          </div>

          {/* Action bar */}
          <div className="flex items-center justify-between border-t pt-2 -mx-2">
            <ReactionPicker
              current={likesData?.userReaction ?? null}
              disabled={toggleLike.isPending}
              onSelect={handleSelectReaction}
              onQuickToggle={handleQuickToggle}
            />
            <Button
              variant="ghost"
              size="sm"
              className="gap-2 text-muted-foreground"
              onClick={() => handleReplyClick(post.id, post.content, post.profiles?.full_name || "Unknown User")}
            >
              <MessageCircle className="h-4 w-4" />
              <span>Comment</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="gap-2 text-muted-foreground"
              onClick={() => handleShareClick(post.id)}
            >
              <Share2 className="h-4 w-4" />
              <span>Share</span>
            </Button>
          </div>

          {/* Permanent comment input */}
          <CommentInput postId={post.id} />
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
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:items-start">
          {/* Left Sidebar */}
          <aside className="hidden lg:block lg:col-span-3">
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
                <Button variant="ghost" className="w-full justify-start gap-3" asChild>
                  <Link to="/career-mapping">
                    <Compass className="h-5 w-5" />
                    <span>Career Mapping</span>
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
          <main className="lg:col-span-6 space-y-4 lg:max-w-[640px] lg:mx-auto w-full">
            {/* Create Post */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex gap-3">
                  <Link to="/profile">
                    <Avatar className="cursor-pointer">
                      <AvatarImage src={profile?.avatar_url || undefined} />
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {getInitials(profile?.full_name)}
                      </AvatarFallback>
                    </Avatar>
                  </Link>
                  <Textarea
                    placeholder={ROTATING_PLACEHOLDERS[placeholderIndex]}
                    className="min-h-[80px]"
                    onFocus={() => {
                      setPostInitialContent("");
                      setIsPostModalOpen(true);
                    }}
                    readOnly
                  />
                </div>
              </CardHeader>
              <CardFooter className="pt-0">
                <Button className="ml-auto" onClick={() => { setPostInitialContent(""); setIsPostModalOpen(true); }}>Post</Button>
              </CardFooter>
            </Card>

            <CreatePostModal
              open={isPostModalOpen}
              onOpenChange={setIsPostModalOpen}
              initialContent={postInitialContent}
            />


            {/* Active filter indicator */}
            {activeHashtag && (
              <div className="flex items-center gap-2 px-1">
                <span className="text-sm text-muted-foreground">Filtering by</span>
                <Badge variant="secondary" className="gap-1">
                  <Hash className="h-3 w-3" />
                  {activeHashtag}
                  <button onClick={() => setActiveHashtag(null)} className="ml-1 hover:text-destructive">✕</button>
                </Badge>
              </div>
            )}

            {/* Posts Feed */}
            {isLoading ? (
              <Card>
                <CardContent className="p-6 text-center text-muted-foreground">
                  Loading posts...
                </CardContent>
              </Card>
            ) : filteredPosts && filteredPosts.length > 0 ? (
              filteredPosts.map((post) => <PostCard key={post.id} post={post} />)
            ) : (
              <Card>
                <CardContent className="p-6 text-center text-muted-foreground">
                  {activeHashtag ? `No posts with #${activeHashtag} yet.` : "No posts yet. Be the first to share something!"}
                </CardContent>
              </Card>
            )}
          </main>

          {/* Right Sidebar */}
          <aside className="lg:col-span-3 space-y-4 lg:sticky lg:top-20 lg:self-start lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto">
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
                    <div
                      key={item.hashtag}
                      className={`cursor-pointer hover:bg-muted/50 p-2 rounded-md transition-colors -mx-2 ${activeHashtag === item.hashtag ? "bg-primary/10 ring-1 ring-primary/30" : ""}`}
                      onClick={() => setActiveHashtag(activeHashtag === item.hashtag ? null : item.hashtag)}
                    >
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
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">
                      No trending topics yet. Try one of these to start a conversation:
                    </p>
                    <div className="flex flex-wrap gap-2 pt-1">
                      {SUGGESTED_HASHTAGS.map((tag) => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => {
                            setPostInitialContent(`#${tag} `);
                            setIsPostModalOpen(true);
                          }}
                          className="inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary hover:bg-primary/20 px-2.5 py-1 text-xs font-medium transition-colors"
                        >
                          <Hash className="h-3 w-3" />
                          {tag}
                        </button>
                      ))}
                    </div>
                  </div>
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
