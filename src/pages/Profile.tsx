import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { 
  Mail, MapPin, Link as LinkIcon, Briefcase, Calendar,
  ThumbsUp, MessageCircle, Share2
} from "lucide-react";
import { ProfileButton } from "@/components/ProfileButton";
import { ReplyModal } from "@/components/ReplyModal";
import { ShareDialog } from "@/components/ShareDialog";
import { Navbar } from "@/components/Navbar";
import { useProfile } from "@/hooks/useProfile";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { usePostLikes, useToggleLike } from "@/hooks/usePostLikes";
import { usePostReplies } from "@/hooks/usePostReplies";
import { formatDistanceToNow } from "date-fns";

const Profile = () => {
  const { data: profile, isLoading: profileLoading } = useProfile();
  const { user } = useAuth();

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

  const { data: userPosts, isLoading: postsLoading } = useQuery({
    queryKey: ["user-posts", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("posts")
        .select("*")
        .eq("author_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const getInitials = (name: string | null | undefined) => {
    if (!name) return "U";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const handleReplyClick = (postId: string, content: string) => {
    setReplyModalState({
      isOpen: true,
      postId,
      postContent: content,
      postAuthor: profile?.full_name || "You",
    });
  };

  const handleShareClick = (postId: string) => {
    setShareDialogState({
      isOpen: true,
      postId,
    });
  };

  const PostActions = ({ post }: { post: any }) => {
    const toggleLike = useToggleLike();
    const { data: likesData } = usePostLikes(post.id);
    const { data: replies = [] } = usePostReplies(post.id);

    const handleLike = () => {
      toggleLike.mutate({
        postId: post.id,
        hasLiked: likesData?.hasLiked || false,
      });
    };

    return (
      <div className="flex items-center gap-6 pl-13 text-sm text-muted-foreground">
        <button
          className={`flex items-center gap-2 hover:text-primary transition-colors ${
            likesData?.hasLiked ? "text-primary" : ""
          }`}
          onClick={handleLike}
          disabled={toggleLike.isPending}
        >
          <ThumbsUp className={`h-4 w-4 ${likesData?.hasLiked ? "fill-current" : ""}`} />
          <span>{likesData?.likeCount || 0}</span>
        </button>
        <button
          className="flex items-center gap-2 hover:text-primary transition-colors"
          onClick={() => handleReplyClick(post.id, post.content)}
        >
          <MessageCircle className="h-4 w-4" />
          <span>{replies.length}</span>
        </button>
        <button
          className="flex items-center gap-2 hover:text-primary transition-colors"
          onClick={() => handleShareClick(post.id)}
        >
          <Share2 className="h-4 w-4" />
          <span>Share</span>
        </button>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Content */}
          <main className="lg:col-span-8 space-y-4">
            {/* Profile Header Card */}
            <Card className="overflow-hidden">
              {/* Cover Photo */}
              <div className="h-56 bg-gradient-to-r from-primary via-secondary to-accent" />
              
              {/* Profile Info */}
              <CardContent className="relative pt-0 px-8 pb-8">
                <div className="flex flex-col gap-6 -mt-20">
                  <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6">
                    <div className="flex flex-col sm:flex-row gap-6 sm:items-end">
                      <Avatar className="h-40 w-40 border-4 border-card shadow-xl">
                        {profile?.avatar_url ? (
                          <AvatarImage src={profile.avatar_url} />
                        ) : (
                          <AvatarFallback className="bg-primary text-primary-foreground text-5xl">
                            {getInitials(profile?.full_name)}
                          </AvatarFallback>
                        )}
                      </Avatar>
                      <div className="space-y-2 pb-2">
                        <h1 className="text-4xl font-bold">{profile?.full_name || "Your Name"}</h1>
                        <p className="text-xl text-muted-foreground">
                          {[profile?.job_title, profile?.company].filter(Boolean).join(" @ ") || "Add your role"}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-3 pb-2">
                      <Button variant="outline" className="gap-2">
                        <Mail className="h-4 w-4" />
                        Message
                      </Button>
                      <ProfileButton />
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-4 text-base text-muted-foreground">
                    {profile?.location && (
                      <span className="flex items-center gap-2">
                        <MapPin className="h-5 w-5" />
                        {profile.location}
                      </span>
                    )}
                    {profile?.website && (
                      <span className="flex items-center gap-2">
                        <LinkIcon className="h-5 w-5" />
                        {profile.website}
                      </span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* About Section */}
            {profile?.bio && (
              <Card>
                <CardHeader>
                  <h2 className="text-xl font-bold">About</h2>
                </CardHeader>
                <CardContent>
                  <p className="text-foreground leading-relaxed whitespace-pre-wrap">
                    {profile.bio}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Experience Section */}
            <Card>
              <CardHeader>
                <h2 className="text-xl font-bold">Experience</h2>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Briefcase className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">Software Engineer</h3>
                    <p className="text-muted-foreground">TechCorp</p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                      <Calendar className="h-4 w-4" />
                      <span>Jan 2022 - Present</span>
                    </div>
                    <p className="mt-3 text-sm leading-relaxed">
                      Leading frontend development for enterprise applications. Mentoring junior developers 
                      and advocating for inclusive hiring practices.
                    </p>
                  </div>
                </div>

                <Separator />

                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded bg-secondary/10 flex items-center justify-center flex-shrink-0">
                    <Briefcase className="h-6 w-6 text-secondary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">Junior Developer</h3>
                    <p className="text-muted-foreground">StartupXYZ</p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                      <Calendar className="h-4 w-4" />
                      <span>Jun 2020 - Dec 2021</span>
                    </div>
                    <p className="mt-3 text-sm leading-relaxed">
                      Developed and maintained web applications using React and Node.js. 
                      Collaborated with cross-functional teams to deliver high-quality features.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Posts Section */}
            <Card>
              <CardHeader>
                <h2 className="text-xl font-bold">Activity</h2>
              </CardHeader>
              <CardContent className="space-y-4">
                {postsLoading ? (
                  <p className="text-muted-foreground text-center">Loading posts...</p>
                ) : userPosts && userPosts.length > 0 ? (
                  userPosts.map((post, index) => (
                    <div key={post.id}>
                      <div className="space-y-3">
                        <div className="flex gap-3">
                          <Avatar className="h-10 w-10">
                            {profile?.avatar_url ? (
                              <AvatarImage src={profile.avatar_url} />
                            ) : (
                              <AvatarFallback className="bg-primary text-primary-foreground">
                                {getInitials(profile?.full_name)}
                              </AvatarFallback>
                            )}
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <div>
                                <h4 className="font-semibold">{profile?.full_name || "You"}</h4>
                                <p className="text-xs text-muted-foreground">
                                  {post.created_at && formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                                </p>
                              </div>
                            </div>
                            <p className="mt-2 text-sm leading-relaxed whitespace-pre-wrap">{post.content}</p>
                          </div>
                        </div>
                        <PostActions post={post} />
                      </div>
                      {index !== userPosts.length - 1 && (
                        <Separator className="mt-4" />
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground text-center">No posts yet.</p>
                )}
              </CardContent>
            </Card>
          </main>

          {/* Right Sidebar */}
          <aside className="lg:col-span-4 space-y-4">
            {/* Connections */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Connections</h3>
                  <Button variant="ghost" size="sm">View all</Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-secondary text-secondary-foreground">
                        U{i}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">User {i}</p>
                      <p className="text-xs text-muted-foreground truncate">Professional Title</p>
                    </div>
                  </div>
                ))}
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

export default Profile;
