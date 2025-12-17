import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { 
  Home, Users, Briefcase, MessageSquare, Bell, 
  Settings, ThumbsUp, MessageCircle, Share2, 
  TrendingUp, Award, Sparkles, Search, BookOpen, Calendar
} from "lucide-react";
import { Link } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { CreatePostModal } from "@/components/CreatePostModal";

const Feed = () => {
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);

  const mockPosts = [
    {
      id: 1,
      author: "Sarah Chen",
      role: "Software Engineer @ TechCorp",
      avatar: "",
      initials: "SC",
      content: "Excited to share that I'll be speaking at the upcoming Diversity in Tech conference! Looking forward to discussing inclusive hiring practices and mentorship programs. 🎤 #DiversityInTech #Inclusion",
      likes: 127,
      comments: 23,
      time: "3h ago"
    },
    {
      id: 2,
      author: "Marcus Johnson",
      role: "Engineering Manager @ InnovateLab",
      avatar: "",
      initials: "MJ",
      content: "Our team just launched a new mentorship program focused on underrepresented groups in tech. If you're interested in being a mentor or mentee, reach out! 🚀 #Mentorship #TechCommunity",
      likes: 89,
      comments: 15,
      time: "5h ago"
    },
    {
      id: 3,
      author: "Priya Patel",
      role: "Product Designer @ DesignStudio",
      avatar: "",
      initials: "PP",
      content: "Just completed a workshop on creating accessible and inclusive design systems. The future of tech is diverse, and our products should reflect that! 💡 #InclusiveDesign #UX",
      likes: 156,
      comments: 31,
      time: "1d ago"
    }
  ];

  const trendingTopics = [
    { topic: "Diversity in Tech", posts: "1.2K posts" },
    { topic: "Inclusive Leadership", posts: "856 posts" },
    { topic: "Tech Mentorship", posts: "2.1K posts" },
    { topic: "Career Growth", posts: "3.4K posts" }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Top Navigation */}
      <header className="sticky top-0 z-50 bg-card border-b">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4 flex-1">
              <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                NextGen Collar
              </h1>
              <div className="hidden md:block flex-1 max-w-md">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Search..." 
                    className="pl-10"
                  />
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon">
                <Bell className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon">
                <MessageSquare className="h-5 w-5" />
              </Button>
              <Link to="/profile">
                <Avatar className="h-8 w-8 cursor-pointer">
                  <AvatarFallback className="bg-primary text-primary-foreground">ME</AvatarFallback>
                </Avatar>
              </Link>
            </div>
          </div>
        </div>
      </header>

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
            {mockPosts.map((post) => (
              <Card key={post.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex gap-3">
                      <Avatar>
                        {post.avatar ? (
                          <AvatarImage src={post.avatar} />
                        ) : (
                          <AvatarFallback className="bg-primary text-primary-foreground">
                            {post.initials}
                          </AvatarFallback>
                        )}
                      </Avatar>
                      <div>
                        <h3 className="font-semibold">{post.author}</h3>
                        <p className="text-sm text-muted-foreground">{post.role}</p>
                        <p className="text-xs text-muted-foreground mt-1">{post.time}</p>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-foreground leading-relaxed">{post.content}</p>
                </CardContent>
                <CardFooter className="flex items-center justify-between border-t pt-3">
                  <Button variant="ghost" size="sm" className="gap-2">
                    <ThumbsUp className="h-4 w-4" />
                    <span>{post.likes}</span>
                  </Button>
                  <Button variant="ghost" size="sm" className="gap-2">
                    <MessageCircle className="h-4 w-4" />
                    <span>{post.comments}</span>
                  </Button>
                  <Button variant="ghost" size="sm" className="gap-2">
                    <Share2 className="h-4 w-4" />
                    <span>Share</span>
                  </Button>
                </CardFooter>
              </Card>
            ))}
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
    </div>
  );
};

export default Feed;
