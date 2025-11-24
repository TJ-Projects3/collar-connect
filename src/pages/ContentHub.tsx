import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Briefcase, FileText, Video, Download, ExternalLink, Calendar, MapPin, ArrowLeft, Home, Users, MessageSquare, Clock, Eye } from "lucide-react";
import { Link } from "react-router-dom";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

type ResourceType = "job" | "article" | "video" | "download";

interface Resource {
  id: string;
  type: ResourceType;
  title: string;
  description?: string;
  metadata: {
    [key: string]: string;
  };
  action?: {
    label: string;
    icon: React.ElementType;
  };
  thumbnail?: string;
}

const ContentHub = () => {
  const allResources: Resource[] = [
    // Jobs
    {
      id: "job-1",
      type: "job",
      title: "Software Engineer",
      description: "Join our diverse team building next-generation solutions.",
      metadata: {
        company: "TechCorp Inc.",
        location: "San Francisco, CA",
        jobType: "Full-time",
        posted: "2 days ago"
      },
      action: { label: "Apply Now", icon: ExternalLink }
    },
    {
      id: "job-2",
      type: "job",
      title: "Product Manager",
      description: "Lead product strategy for our inclusive tech platform.",
      metadata: {
        company: "Innovation Labs",
        location: "Remote",
        jobType: "Full-time",
        posted: "5 days ago"
      },
      action: { label: "Apply Now", icon: ExternalLink }
    },
    // Articles
    {
      id: "article-1",
      type: "article",
      title: "Breaking Barriers in Tech: A Guide to Inclusive Hiring",
      description: "Learn how to build diverse teams and create inclusive workplace cultures.",
      metadata: {
        author: "Sarah Johnson",
        date: "March 15, 2025",
        readTime: "5 min read"
      },
      action: { label: "Read More", icon: ExternalLink }
    },
    {
      id: "article-2",
      type: "article",
      title: "The Future of Work: Embracing Diversity in Technology",
      description: "Exploring trends and opportunities for underrepresented groups in tech.",
      metadata: {
        author: "Michael Chen",
        date: "March 10, 2025",
        readTime: "8 min read"
      },
      action: { label: "Read More", icon: ExternalLink }
    },
    // Videos
    {
      id: "video-1",
      type: "video",
      title: "NextGen Collar: Our Mission",
      thumbnail: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400",
      metadata: {
        duration: "3:45",
        views: "1.2K"
      }
    },
    {
      id: "video-2",
      type: "video",
      title: "Tech Career Workshop",
      thumbnail: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=400",
      metadata: {
        duration: "45:30",
        views: "856"
      }
    },
    {
      id: "video-3",
      type: "video",
      title: "Diversity in Action: Success Stories",
      thumbnail: "https://images.unsplash.com/photo-1531482615713-2afd69097998?w=400",
      metadata: {
        duration: "12:15",
        views: "2.3K"
      }
    },
    // Downloads
    {
      id: "download-1",
      type: "download",
      title: "Diversity & Inclusion Guide 2025",
      metadata: {
        fileType: "PDF",
        size: "2.4 MB",
        downloads: "456"
      },
      action: { label: "Download", icon: Download }
    },
    {
      id: "download-2",
      type: "download",
      title: "Career Development Template",
      metadata: {
        fileType: "DOCX",
        size: "850 KB",
        downloads: "234"
      },
      action: { label: "Download", icon: Download }
    },
    {
      id: "download-3",
      type: "download",
      title: "Interview Preparation Checklist",
      metadata: {
        fileType: "PDF",
        size: "1.1 MB",
        downloads: "678"
      },
      action: { label: "Download", icon: Download }
    },
    {
      id: "job-3",
      type: "job",
      title: "UX Designer",
      description: "Create accessible experiences for diverse user groups.",
      metadata: {
        company: "Design Studio",
        location: "New York, NY",
        jobType: "Contract",
        posted: "1 week ago"
      },
      action: { label: "Apply Now", icon: ExternalLink }
    },
    {
      id: "article-3",
      type: "article",
      title: "Mentorship Programs That Work",
      description: "Best practices for creating effective mentorship initiatives.",
      metadata: {
        author: "Emma Rodriguez",
        date: "March 5, 2025",
        readTime: "6 min read"
      },
      action: { label: "Read More", icon: ExternalLink }
    },
    {
      id: "download-4",
      type: "download",
      title: "Tech Skills Roadmap",
      metadata: {
        fileType: "PDF",
        size: "3.2 MB",
        downloads: "892"
      },
      action: { label: "Download", icon: Download }
    }
  ];

  const getResourceIcon = (type: ResourceType) => {
    switch (type) {
      case "job":
        return Briefcase;
      case "article":
        return FileText;
      case "video":
        return Video;
      case "download":
        return FileText;
    }
  };

  const getResourceBadgeLabel = (type: ResourceType) => {
    switch (type) {
      case "job":
        return "Job Opening";
      case "article":
        return "Article";
      case "video":
        return "Video";
      case "download":
        return "Resource";
    }
  };

  const renderResourceCard = (resource: Resource) => {
    const Icon = getResourceIcon(resource.type);
    const ActionIcon = resource.action?.icon;

    if (resource.type === "video") {
      return (
        <Card key={resource.id} className="overflow-hidden hover:shadow-lg transition-all duration-300 rounded-xl border-border/50">
          <div className="relative aspect-video bg-muted">
            <img
              src={resource.thumbnail}
              alt={resource.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-center justify-center group hover:from-black/70 transition-all cursor-pointer">
              <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
                <Video className="h-8 w-8 text-primary-foreground" />
              </div>
            </div>
            <Badge className="absolute top-3 left-3 bg-primary/90 text-primary-foreground border-0">
              <Video className="h-3 w-3 mr-1" />
              Video
            </Badge>
            <Badge className="absolute bottom-3 right-3 bg-black/70 text-white border-0">
              <Clock className="h-3 w-3 mr-1" />
              {resource.metadata.duration}
            </Badge>
          </div>
          <CardHeader className="space-y-2">
            <CardTitle className="text-lg leading-tight">{resource.title}</CardTitle>
            <CardDescription className="flex items-center gap-2">
              <Eye className="h-3 w-3" />
              {resource.metadata.views} views
            </CardDescription>
          </CardHeader>
        </Card>
      );
    }

    return (
      <Card key={resource.id} className="hover:shadow-lg transition-all duration-300 rounded-xl border-border/50">
        <CardHeader className="space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 flex-1">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Icon className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <CardTitle className="text-lg leading-tight mb-2">{resource.title}</CardTitle>
                {resource.description && (
                  <CardDescription className="text-sm leading-relaxed">
                    {resource.description}
                  </CardDescription>
                )}
              </div>
            </div>
            <Badge variant="secondary" className="flex-shrink-0">
              {getResourceBadgeLabel(resource.type)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
            {resource.type === "job" && (
              <>
                <span className="font-medium text-foreground">{resource.metadata.company}</span>
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  {resource.metadata.location}
                </span>
                <Badge variant="outline" className="text-xs">
                  {resource.metadata.jobType}
                </Badge>
                <span className="flex items-center gap-1 ml-auto">
                  <Calendar className="h-3.5 w-3.5" />
                  {resource.metadata.posted}
                </span>
              </>
            )}
            {resource.type === "article" && (
              <>
                <span>By {resource.metadata.author}</span>
                <span>•</span>
                <span>{resource.metadata.date}</span>
                <span>•</span>
                <span>{resource.metadata.readTime}</span>
              </>
            )}
            {resource.type === "download" && (
              <>
                <span className="font-medium">{resource.metadata.fileType}</span>
                <span>•</span>
                <span>{resource.metadata.size}</span>
                <span>•</span>
                <span>{resource.metadata.downloads} downloads</span>
              </>
            )}
          </div>
          {resource.action && ActionIcon && (
            <Button className="w-full sm:w-auto">
              {resource.action.label}
              <ActionIcon className="h-4 w-4 ml-2" />
            </Button>
          )}
        </CardContent>
      </Card>
    );
  };

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
                  All resources in one place
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
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-foreground mb-2">Discover Resources</h2>
          <p className="text-muted-foreground">
            Jobs, articles, videos, and downloadable resources all in one place
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {allResources.map((resource) => renderResourceCard(resource))}
        </div>
      </main>
    </div>
  );
};

export default ContentHub;
