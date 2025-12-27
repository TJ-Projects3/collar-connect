import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Video, Download, ExternalLink, Eye, Loader2, Globe } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { useResources, type Resource } from "@/hooks/useResources";
import { format } from "date-fns";

// Security: Validate URL protocol to prevent XSS via javascript: URLs
const isSafeUrl = (url: string | null): boolean => {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
};

const ContentHub = () => {
  const { data: resources, isLoading } = useResources();

  const getResourceIcon = (type: string) => {
    switch (type) {
      case "article":
        return FileText;
      case "video":
        return Video;
      case "download":
        return Download;
      case "website":
        return Globe;
      default:
        return FileText;
    }
  };

  const getResourceBadgeLabel = (type: string) => {
    switch (type) {
      case "article":
        return "Article";
      case "video":
        return "Video";
      case "download":
        return "Download";
      case "website":
        return "Website";
      default:
        return "Resource";
    }
  };

  const renderResourceCard = (resource: Resource) => {
    const Icon = getResourceIcon(resource.resource_type);

    if (resource.resource_type === "video") {
      return (
        <Card key={resource.id} className="overflow-hidden hover:shadow-lg transition-all duration-300 rounded-xl border-border/50">
          <div className="relative aspect-video bg-muted">
            {resource.image_url && isSafeUrl(resource.image_url) && (
              <img
                src={resource.image_url}
                alt={resource.title}
                className="w-full h-full object-cover"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-center justify-center group hover:from-black/70 transition-all cursor-pointer">
              <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
                <Video className="h-8 w-8 text-primary-foreground" />
              </div>
            </div>
            <Badge className="absolute top-3 left-3 bg-primary/90 text-primary-foreground border-0">
              <Video className="h-3 w-3 mr-1" />
              Video
            </Badge>
          </div>
          <CardHeader className="space-y-2">
            <CardTitle className="text-lg leading-tight">{resource.title}</CardTitle>
            {resource.description && (
              <CardDescription>{resource.description}</CardDescription>
            )}
            <CardDescription className="flex items-center gap-2">
              <Eye className="h-3 w-3" />
              {resource.view_count || 0} views
            </CardDescription>
          </CardHeader>
          {isSafeUrl(resource.external_url) && (
            <CardContent>
              <Button asChild className="w-full sm:w-auto">
                <a href={resource.external_url} target="_blank" rel="noopener noreferrer">
                  Watch Video
                  <ExternalLink className="h-4 w-4 ml-2" />
                </a>
              </Button>
            </CardContent>
          )}
        </Card>
      );
    }

    return (
      <Card key={resource.id} className="hover:shadow-lg transition-all duration-300 rounded-xl border-border/50">
        <CardHeader className="space-y-3">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Icon className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <div className="flex items-start justify-between gap-3 mb-2">
                <CardTitle className="text-lg leading-tight flex-1">{resource.title}</CardTitle>
                <Badge variant="secondary" className="flex-shrink-0">
                  {getResourceBadgeLabel(resource.resource_type)}
                </Badge>
              </div>
              {resource.description && (
                <CardDescription className="text-sm leading-relaxed max-w-none">
                  {resource.description}
                </CardDescription>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {resource.resource_type === "article" && (
            <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
              <span>{format(new Date(resource.created_at), "MMMM d, yyyy")}</span>
              {resource.view_count !== null && resource.view_count > 0 && (
                <>
                  <span>•</span>
                  <span>{resource.view_count} views</span>
                </>
              )}
            </div>
          )}
          {resource.resource_type === "download" && (
            <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
              {resource.view_count !== null && resource.view_count > 0 && (
                <span>{resource.view_count} downloads</span>
              )}
            </div>
          )}
          {resource.resource_type === "article" && isSafeUrl(resource.external_url) && (
            <Button asChild className="w-full sm:w-auto">
              <a href={resource.external_url} target="_blank" rel="noopener noreferrer">
                Read More
                <ExternalLink className="h-4 w-4 ml-2" />
              </a>
            </Button>
          )}
          {resource.resource_type === "download" && isSafeUrl(resource.file_url) && (
            <Button asChild className="w-full sm:w-auto">
              <a href={resource.file_url} target="_blank" rel="noopener noreferrer">
                Download
                <Download className="h-4 w-4 ml-2" />
              </a>
            </Button>
          )}
          {resource.resource_type === "website" && isSafeUrl(resource.external_url) && (
            <Button asChild className="w-full sm:w-auto">
              <a href={resource.external_url} target="_blank" rel="noopener noreferrer">
                Visit Website
                <ExternalLink className="h-4 w-4 ml-2" />
              </a>
            </Button>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Content Hub</h1>
          <p className="text-muted-foreground">
            Articles, videos, websites, and downloadable resources all in one place
          </p>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : resources && resources.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {resources.map((resource) => renderResourceCard(resource))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No resources available yet.</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default ContentHub;
