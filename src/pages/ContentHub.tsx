import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Briefcase, FileText, Video, Download, ExternalLink, Calendar, MapPin, ArrowLeft, Home, Users, MessageSquare } from "lucide-react";
import { Link } from "react-router-dom";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const ContentHub = () => {
  const jobs = [
    {
      id: 1,
      title: "Software Engineer",
      company: "TechCorp Inc.",
      location: "San Francisco, CA",
      type: "Full-time",
      posted: "2 days ago",
      description: "Join our diverse team building next-generation solutions."
    },
    {
      id: 2,
      title: "Product Manager",
      company: "Innovation Labs",
      location: "Remote",
      type: "Full-time",
      posted: "5 days ago",
      description: "Lead product strategy for our inclusive tech platform."
    },
    {
      id: 3,
      title: "UX Designer",
      company: "Design Studio",
      location: "New York, NY",
      type: "Contract",
      posted: "1 week ago",
      description: "Create accessible experiences for diverse user groups."
    }
  ];

  const articles = [
    {
      id: 1,
      title: "Breaking Barriers in Tech: A Guide to Inclusive Hiring",
      author: "Sarah Johnson",
      date: "March 15, 2025",
      readTime: "5 min read",
      excerpt: "Learn how to build diverse teams and create inclusive workplace cultures."
    },
    {
      id: 2,
      title: "The Future of Work: Embracing Diversity in Technology",
      author: "Michael Chen",
      date: "March 10, 2025",
      readTime: "8 min read",
      excerpt: "Exploring trends and opportunities for underrepresented groups in tech."
    },
    {
      id: 3,
      title: "Mentorship Programs That Work",
      author: "Emma Rodriguez",
      date: "March 5, 2025",
      readTime: "6 min read",
      excerpt: "Best practices for creating effective mentorship initiatives."
    }
  ];

  const videos = [
    {
      id: 1,
      title: "NextGen Collar: Our Mission",
      duration: "3:45",
      thumbnail: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400",
      views: "1.2K"
    },
    {
      id: 2,
      title: "Tech Career Workshop",
      duration: "45:30",
      thumbnail: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=400",
      views: "856"
    },
    {
      id: 3,
      title: "Diversity in Action: Success Stories",
      duration: "12:15",
      thumbnail: "https://images.unsplash.com/photo-1531482615713-2afd69097998?w=400",
      views: "2.3K"
    }
  ];

  const resources = [
    {
      id: 1,
      name: "Diversity & Inclusion Guide 2025",
      type: "PDF",
      size: "2.4 MB",
      downloads: 456
    },
    {
      id: 2,
      name: "Career Development Template",
      type: "DOCX",
      size: "850 KB",
      downloads: 234
    },
    {
      id: 3,
      name: "Interview Preparation Checklist",
      type: "PDF",
      size: "1.1 MB",
      downloads: 678
    },
    {
      id: 4,
      name: "Tech Skills Roadmap",
      type: "PDF",
      size: "3.2 MB",
      downloads: 892
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" asChild>
                <Link to="/feed" className="gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  <span className="hidden sm:inline">Back to Feed</span>
                </Link>
              </Button>
              <div className="h-8 w-px bg-border hidden sm:block" />
              <div>
                <h1 className="text-xl font-bold text-primary">Content Hub</h1>
                <p className="text-xs text-muted-foreground hidden sm:block">
                  Jobs, articles, videos, and resources
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" asChild className="hidden sm:flex">
                <Link to="/feed">
                  <Home className="h-5 w-5" />
                </Link>
              </Button>
              <Button variant="ghost" size="icon" className="hidden sm:flex">
                <Users className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" className="hidden sm:flex">
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

      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="jobs" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-8">
            <TabsTrigger value="jobs" className="flex items-center gap-2">
              <Briefcase className="h-4 w-4" />
              Jobs
            </TabsTrigger>
            <TabsTrigger value="articles" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Articles
            </TabsTrigger>
            <TabsTrigger value="videos" className="flex items-center gap-2">
              <Video className="h-4 w-4" />
              Videos
            </TabsTrigger>
            <TabsTrigger value="resources" className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Resources
            </TabsTrigger>
          </TabsList>

          {/* Jobs Tab */}
          <TabsContent value="jobs" className="space-y-4">
            {jobs.map((job) => (
              <Card key={job.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-xl">{job.title}</CardTitle>
                      <CardDescription className="flex items-center gap-4 text-base">
                        <span className="font-medium text-foreground">{job.company}</span>
                        <span className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {job.location}
                        </span>
                      </CardDescription>
                    </div>
                    <Badge variant="secondary">{job.type}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">{job.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      Posted {job.posted}
                    </span>
                    <Button>
                      Apply Now
                      <ExternalLink className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* Articles Tab */}
          <TabsContent value="articles" className="space-y-4">
            {articles.map((article) => (
              <Card key={article.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="text-xl">{article.title}</CardTitle>
                  <CardDescription className="flex items-center gap-4">
                    <span>By {article.author}</span>
                    <span>•</span>
                    <span>{article.date}</span>
                    <span>•</span>
                    <span>{article.readTime}</span>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">{article.excerpt}</p>
                  <Button variant="outline">
                    Read More
                    <ExternalLink className="h-4 w-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* Videos Tab */}
          <TabsContent value="videos">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {videos.map((video) => (
                <Card key={video.id} className="overflow-hidden hover:shadow-md transition-shadow">
                  <div className="relative aspect-video bg-muted">
                    <img
                      src={video.thumbnail}
                      alt={video.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center group hover:bg-black/50 transition-colors cursor-pointer">
                      <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Video className="h-8 w-8 text-primary-foreground" />
                      </div>
                    </div>
                    <Badge className="absolute bottom-2 right-2 bg-black/70">
                      {video.duration}
                    </Badge>
                  </div>
                  <CardHeader>
                    <CardTitle className="text-lg">{video.title}</CardTitle>
                    <CardDescription>{video.views} views</CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Resources Tab */}
          <TabsContent value="resources" className="space-y-4">
            {resources.map((resource) => (
              <Card key={resource.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                        <FileText className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{resource.name}</CardTitle>
                        <CardDescription>
                          {resource.type} • {resource.size} • {resource.downloads} downloads
                        </CardDescription>
                      </div>
                    </div>
                    <Button>
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default ContentHub;