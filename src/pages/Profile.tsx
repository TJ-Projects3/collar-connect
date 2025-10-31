import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  ArrowLeft, Home, Users, MessageSquare, Mail, 
  MapPin, Briefcase, Calendar, Link as LinkIcon,
  ThumbsUp, MessageCircle, Share2, Edit
} from "lucide-react";
import { Link } from "react-router-dom";

const Profile = () => {
  const userPosts = [
    {
      id: 1,
      content: "Excited to share that I'll be speaking at the upcoming Diversity in Tech conference! Looking forward to discussing inclusive hiring practices and mentorship programs. 🎤 #DiversityInTech #Inclusion",
      likes: 127,
      comments: 23,
      time: "3h ago"
    },
    {
      id: 2,
      content: "Just completed an amazing workshop on leadership and team building. The key takeaway: empowering others is the foundation of great leadership. 💡 #Leadership #Growth",
      likes: 89,
      comments: 15,
      time: "2d ago"
    },
    {
      id: 3,
      content: "Grateful for the amazing mentorship opportunities in our tech community. If you're looking for guidance or want to give back, don't hesitate to reach out! 🚀 #Mentorship",
      likes: 156,
      comments: 31,
      time: "5d ago"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Top Navigation */}
      <header className="sticky top-0 z-50 bg-card border-b">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" asChild>
                <Link to="/feed" className="gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  <span className="hidden sm:inline">Back to Feed</span>
                </Link>
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" asChild>
                <Link to="/feed">
                  <Home className="h-5 w-5" />
                </Link>
              </Button>
              <Button variant="ghost" size="icon">
                <Users className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon">
                <MessageSquare className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Content */}
          <main className="lg:col-span-8 space-y-4">
            {/* Profile Header Card */}
            <Card className="overflow-hidden">
              {/* Cover Photo */}
              <div className="h-48 bg-gradient-to-r from-primary via-secondary to-accent" />
              
              {/* Profile Info */}
              <CardContent className="relative pt-0 px-6 pb-6">
                <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 -mt-16 sm:-mt-20">
                  <div className="flex flex-col sm:flex-row gap-4 sm:items-end">
                    <Avatar className="h-32 w-32 border-4 border-card">
                      <AvatarFallback className="bg-primary text-primary-foreground text-4xl">
                        ME
                      </AvatarFallback>
                    </Avatar>
                    <div className="space-y-1">
                      <h1 className="text-3xl font-bold">My Profile</h1>
                      <p className="text-lg text-muted-foreground">Software Engineer @ TechCorp</p>
                      <div className="flex flex-wrap gap-3 text-sm text-muted-foreground mt-2">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          San Francisco, CA
                        </span>
                        <span className="flex items-center gap-1">
                          <LinkIcon className="h-4 w-4" />
                          portfolio.com
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="gap-2">
                      <Mail className="h-4 w-4" />
                      Message
                    </Button>
                    <Button size="sm" className="gap-2">
                      <Edit className="h-4 w-4" />
                      Edit Profile
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* About Section */}
            <Card>
              <CardHeader>
                <h2 className="text-xl font-bold">About</h2>
              </CardHeader>
              <CardContent>
                <p className="text-foreground leading-relaxed">
                  Passionate software engineer with 5+ years of experience building scalable web applications. 
                  Dedicated to promoting diversity and inclusion in tech through mentorship and community engagement. 
                  Always eager to learn new technologies and share knowledge with others.
                </p>
                <div className="flex flex-wrap gap-2 mt-4">
                  <Badge variant="secondary">React</Badge>
                  <Badge variant="secondary">TypeScript</Badge>
                  <Badge variant="secondary">Node.js</Badge>
                  <Badge variant="secondary">Python</Badge>
                  <Badge variant="secondary">AWS</Badge>
                  <Badge variant="secondary">Leadership</Badge>
                </div>
              </CardContent>
            </Card>

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
                {userPosts.map((post) => (
                  <div key={post.id}>
                    <div className="space-y-3">
                      <div className="flex gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-primary text-primary-foreground">
                            ME
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-semibold">My Profile</h4>
                              <p className="text-xs text-muted-foreground">{post.time}</p>
                            </div>
                          </div>
                          <p className="mt-2 text-sm leading-relaxed">{post.content}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-6 pl-13 text-sm text-muted-foreground">
                        <button className="flex items-center gap-2 hover:text-primary transition-colors">
                          <ThumbsUp className="h-4 w-4" />
                          <span>{post.likes}</span>
                        </button>
                        <button className="flex items-center gap-2 hover:text-primary transition-colors">
                          <MessageCircle className="h-4 w-4" />
                          <span>{post.comments}</span>
                        </button>
                        <button className="flex items-center gap-2 hover:text-primary transition-colors">
                          <Share2 className="h-4 w-4" />
                          <span>Share</span>
                        </button>
                      </div>
                    </div>
                    {post.id !== userPosts[userPosts.length - 1].id && (
                      <Separator className="mt-4" />
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          </main>

          {/* Right Sidebar */}
          <aside className="lg:col-span-4 space-y-4">
            {/* Profile Strength */}
            <Card>
              <CardHeader>
                <h3 className="font-semibold">Profile Strength</h3>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Advanced</span>
                    <span className="text-sm text-muted-foreground">85%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div className="bg-primary h-2 rounded-full" style={{ width: '85%' }} />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Add 2 more skills to reach All-Star level
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Analytics */}
            <Card>
              <CardHeader>
                <h3 className="font-semibold">Profile Analytics</h3>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-2xl font-bold text-primary">1,234</p>
                  <p className="text-sm text-muted-foreground">Profile views this month</p>
                </div>
                <Separator />
                <div>
                  <p className="text-2xl font-bold text-secondary">567</p>
                  <p className="text-sm text-muted-foreground">Post impressions</p>
                </div>
                <Separator />
                <div>
                  <p className="text-2xl font-bold text-accent">89</p>
                  <p className="text-sm text-muted-foreground">Search appearances</p>
                </div>
              </CardContent>
            </Card>

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
    </div>
  );
};

export default Profile;
