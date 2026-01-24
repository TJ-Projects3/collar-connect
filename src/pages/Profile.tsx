import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  Mail, MapPin, Link as LinkIcon, Briefcase, Calendar,
  ThumbsUp, MessageCircle, Share2, Plus, Pencil, Trash2
} from "lucide-react";
import { ProfileButton } from "@/components/ProfileButton";
import { ReplyModal } from "@/components/ReplyModal";
import { ShareDialog } from "@/components/ShareDialog";
import { InlineReplies } from "@/components/InlineReplies";
import { ExperienceFormModal } from "@/components/ExperienceFormModal";
import { Navbar } from "@/components/Navbar";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { usePostLikes, useToggleLike } from "@/hooks/usePostLikes";
import { usePostReplies } from "@/hooks/usePostReplies";
import { useExperiences, useDeleteExperience, type Experience } from "@/hooks/useExperiences";
import { formatDistanceToNow, format } from "date-fns";
import { useSearchParams } from "react-router-dom";
import { useSendMessage } from "@/hooks/useMessaging";
import { useToast } from "@/hooks/use-toast";
import { useAllProfiles } from "@/hooks/useAllProfiles";
import { Link } from "react-router-dom";

const Profile = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const viewedUserId = searchParams.get("userId") || user?.id || null;

  // Fetch profile for viewed user (fallback to current user)
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["profile", viewedUserId],
    queryFn: async () => {
      if (!viewedUserId) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", viewedUserId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!viewedUserId,
  });

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

  const [messageDialogOpen, setMessageDialogOpen] = useState(false);
  const [messageText, setMessageText] = useState("");
  const sendMessage = useSendMessage();
  const { toast } = useToast();

  // Experience state
  const [experienceModalOpen, setExperienceModalOpen] = useState(false);
  const [editingExperience, setEditingExperience] = useState<Experience | null>(null);
  const { data: experiences = [], isLoading: experiencesLoading } = useExperiences(viewedUserId);
  const deleteExperience = useDeleteExperience();

  const isOwnProfile = viewedUserId === user?.id;

  const handleEditExperience = (exp: Experience) => {
    setEditingExperience(exp);
    setExperienceModalOpen(true);
  };

  const handleDeleteExperience = async (id: string) => {
    try {
      await deleteExperience.mutateAsync(id);
      toast({
        title: "Experience deleted",
        description: "Your experience has been removed.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete experience.",
        variant: "destructive",
      });
    }
  };

  const formatExperienceDate = (dateStr: string) => {
    return format(new Date(dateStr), "MMM yyyy");
  };

  const { data: userPosts, isLoading: postsLoading } = useQuery({
    queryKey: ["user-posts", viewedUserId],
    queryFn: async () => {
      if (!viewedUserId) return [];
      const { data, error } = await supabase
        .from("posts")
        .select("*")
        .eq("author_id", viewedUserId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!viewedUserId,
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

  const handleSendMessage = () => {
    if (!viewedUserId || !messageText.trim()) return;
    sendMessage.mutate(
      { recipientId: viewedUserId, content: messageText.trim() },
      {
        onSuccess: () => {
          setMessageDialogOpen(false);
          setMessageText("");
        },
      }
    );
  };

  // Connections sidebar component
  const ConnectionsSidebar = ({ currentUserId }: { currentUserId: string | null }) => {
    const { data: allProfiles, isLoading } = useAllProfiles();
    
    // Filter out the current user and limit to 5 connections
    const connections = useMemo(() => {
      if (!allProfiles) return [];
      return allProfiles
        .filter(p => p.id !== currentUserId)
        .slice(0, 5);
    }, [allProfiles, currentUserId]);

    const getInitials = (name: string | null) => {
      if (!name) return "??";
      const names = name.trim().split(" ");
      if (names.length >= 2) {
        return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
      }
      return name.substring(0, 2).toUpperCase();
    };

    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Connections</h3>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/my-network">View all</Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {isLoading ? (
            <p className="text-sm text-muted-foreground text-center">Loading...</p>
          ) : connections.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center">No connections yet</p>
          ) : (
            connections.map((connection) => (
              <Link
                key={connection.id}
                to={`/profile?userId=${connection.id}`}
                className="flex items-center gap-3 hover:bg-muted/50 rounded-lg p-1 -mx-1 transition-colors"
              >
                <Avatar className="h-10 w-10">
                  <AvatarImage src={connection.avatar_url || undefined} />
                  <AvatarFallback className="bg-secondary text-secondary-foreground">
                    {getInitials(connection.full_name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{connection.full_name || "Unknown"}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {connection.job_title || "Tech Professional"}
                  </p>
                </div>
              </Link>
            ))
          )}
        </CardContent>
      </Card>
    );
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
        {profileLoading ? (
          <div className="flex items-center justify-center py-12">
            <p className="text-muted-foreground">Loading profile...</p>
          </div>
        ) : !profile ? (
          <div className="flex items-center justify-center py-12">
            <p className="text-muted-foreground">Profile not found</p>
          </div>
        ) : (
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
                          {[profile?.job_title, profile?.company].filter(Boolean).join(" @ ") || "Welcome to NextGenCollar!"}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-3 pb-2">
                      <Button
                        variant="outline"
                        className="gap-2"
                        onClick={() => setMessageDialogOpen(true)}
                      >
                        <Mail className="h-4 w-4" />
                        Message
                      </Button>
                      {viewedUserId === user?.id && <ProfileButton />}
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
              <CardHeader className="flex flex-row items-center justify-between">
                <h2 className="text-xl font-bold">Experience</h2>
                {isOwnProfile && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setEditingExperience(null);
                      setExperienceModalOpen(true);
                    }}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add
                  </Button>
                )}
              </CardHeader>
              <CardContent className="space-y-6">
                {experiencesLoading ? (
                  <p className="text-muted-foreground text-center">Loading experiences...</p>
                ) : experiences.length === 0 ? (
                  <p className="text-muted-foreground text-center">
                    {isOwnProfile ? "No experience added yet. Click 'Add' to add your work history." : "No experience added yet."}
                  </p>
                ) : (
                  experiences.map((exp, index) => (
                    <div key={exp.id}>
                      <div className="flex gap-4">
                        <div className="w-12 h-12 rounded bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Briefcase className="h-6 w-6 text-primary" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="font-semibold text-lg">{exp.title}</h3>
                              <p className="text-muted-foreground">{exp.company}</p>
                              {exp.location && (
                                <p className="text-sm text-muted-foreground">{exp.location}</p>
                              )}
                            </div>
                            {isOwnProfile && (
                              <div className="flex gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => handleEditExperience(exp)}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-destructive hover:text-destructive"
                                  onClick={() => handleDeleteExperience(exp.id)}
                                  disabled={deleteExperience.isPending}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                            <Calendar className="h-4 w-4" />
                            <span>
                              {formatExperienceDate(exp.start_date)} - {exp.is_current ? "Present" : exp.end_date ? formatExperienceDate(exp.end_date) : "Present"}
                            </span>
                          </div>
                          {exp.description && (
                            <p className="mt-3 text-sm leading-relaxed whitespace-pre-wrap">
                              {exp.description}
                            </p>
                          )}
                        </div>
                      </div>
                      {index !== experiences.length - 1 && <Separator className="mt-6" />}
                    </div>
                  ))
                )}
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

                            {/* Inline Replies */}
                            <InlineReplies postId={post.id} replyCount={post.reply_count || 0} />
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
            <ConnectionsSidebar currentUserId={viewedUserId} />
          </aside>
        </div>
        )}
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
      <ExperienceFormModal
        open={experienceModalOpen}
        onOpenChange={(open) => {
          setExperienceModalOpen(open);
          if (!open) setEditingExperience(null);
        }}
        experience={editingExperience}
      />

      {/* Message Dialog */}
      <Dialog open={messageDialogOpen} onOpenChange={setMessageDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Message {profile?.full_name || "User"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Type your message..."
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              className="min-h-[100px] py-2 px-3 align-top"
              style={{ resize: "vertical" }}
            />
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setMessageDialogOpen(false);
                  setMessageText("");
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleSendMessage} disabled={sendMessage.isPending || !messageText.trim()}>
                {sendMessage.isPending ? "Sending..." : "Send"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Profile;
