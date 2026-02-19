import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { FileText, Video, Download, ExternalLink, Eye, Loader2, Globe, Star, Search } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { useResources, type Resource } from "@/hooks/useResources";
import { format } from "date-fns";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";

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

const getYouTubeVideoId = (url: string): string | null => {
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes('youtube.com')) {
      if (parsed.pathname.startsWith('/embed/')) {
        return parsed.pathname.split('/embed/')[1].split('/')[0] || null;
      }
      return parsed.searchParams.get('v');
    }
    if (parsed.hostname === 'youtu.be') {
      return parsed.pathname.slice(1).split('/')[0] || null;
    }
  } catch {
    return null;
  }
  return null;
};

const getVideoThumbnail = (resource: Resource): string | null => {
  if (resource.image_url && isSafeUrl(resource.image_url)) {
    return resource.image_url;
  }
  if (resource.external_url && isSafeUrl(resource.external_url)) {
    const ytId = getYouTubeVideoId(resource.external_url);
    if (ytId) return `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`;
  }
  return null;
};

const ContentHub = () => {
  const { data: resources, isLoading } = useResources();
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(() => searchParams.get("search") || "");
  const [selectedType, setSelectedType] = useState("all");

  useEffect(() => {
    setSearchQuery(searchParams.get("search") || "");
  }, [searchParams]);

  const filteredResources = useMemo(() => {
    if (!resources) return [];
    let filtered = resources;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (resource) =>
          resource.title.toLowerCase().includes(q) ||
          resource.description?.toLowerCase().includes(q)
      );
    }
    if (selectedType !== "all") {
      filtered = filtered.filter((resource) => resource.resource_type === selectedType);
    }
    return [...filtered].sort((a, b) => Number(!!b.is_featured) - Number(!!a.is_featured));
  }, [resources, searchQuery, selectedType]);

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
      const thumbnail = getVideoThumbnail(resource);
      return (
        <Card key={resource.id} className="overflow-hidden hover:shadow-lg transition-all duration-300 rounded-xl border-border/50 flex flex-col">
          <div className="relative aspect-video bg-muted flex-shrink-0">
            {thumbnail && (
              <img
                src={thumbnail}
                alt={resource.title}
                className="w-full h-full object-cover"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-center justify-center group hover:from-black/70 transition-all cursor-pointer">
              <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
                <Video className="h-7 w-7 text-primary-foreground" />
              </div>
            </div>
            <div className="absolute top-3 left-3 flex items-center gap-2">
              {resource.is_featured && (
                <Badge className="bg-amber-500 text-white border-0">
                  <Star className="h-3 w-3 mr-1 fill-current" />
                  Featured
                </Badge>
              )}
              <Badge className="bg-primary/90 text-primary-foreground border-0">
                <Video className="h-3 w-3 mr-1" />
                Video
              </Badge>
            </div>
          </div>
          <CardHeader className="pb-2">
            <CardTitle className="text-base leading-snug">{resource.title}</CardTitle>
            {resource.description && (
              <CardDescription className="line-clamp-2">{resource.description}</CardDescription>
            )}
          </CardHeader>
          <CardContent className="mt-auto pt-0 space-y-3">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Eye className="h-3 w-3" />
              {resource.view_count || 0} views
            </div>
            {isSafeUrl(resource.external_url) && (
              <Button asChild size="sm" className="w-full sm:w-auto">
                <a href={resource.external_url} target="_blank" rel="noopener noreferrer">
                  Watch Video
                  <ExternalLink className="h-3.5 w-3.5 ml-2" />
                </a>
              </Button>
            )}
          </CardContent>
        </Card>
      );
    }

    return (
      <Card key={resource.id} className="hover:shadow-lg transition-all duration-300 rounded-xl border-border/50 flex flex-col">
        <CardHeader className="pb-2">
          {/* Badges row — no overlap */}
          <div className="flex items-center gap-2 mb-2">
            {resource.is_featured && (
              <Badge className="bg-amber-500 text-white border-0">
                <Star className="h-3 w-3 mr-1 fill-current" />
                Featured
              </Badge>
            )}
            <Badge variant="secondary">
              {getResourceBadgeLabel(resource.resource_type)}
            </Badge>
          </div>
          {/* Icon + title */}
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Icon className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <CardTitle className="text-base leading-snug">{resource.title}</CardTitle>
              {resource.description && (
                <CardDescription className="text-sm mt-1 line-clamp-2">
                  {resource.description}
                </CardDescription>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="mt-auto pt-0 space-y-3">
          {resource.resource_type === "article" && (
            <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
              <span>{format(new Date(resource.created_at), "MMM d, yyyy")}</span>
              {resource.view_count !== null && resource.view_count > 0 && (
                <>
                  <span>•</span>
                  <span>{resource.view_count} views</span>
                </>
              )}
            </div>
          )}
          {resource.resource_type === "download" && resource.view_count !== null && resource.view_count > 0 && (
            <p className="text-xs text-muted-foreground">{resource.view_count} downloads</p>
          )}
          {resource.resource_type === "article" && isSafeUrl(resource.external_url) && (
            <Button asChild size="sm" className="w-full sm:w-auto">
              <a href={resource.external_url} target="_blank" rel="noopener noreferrer">
                Read More
                <ExternalLink className="h-3.5 w-3.5 ml-2" />
              </a>
            </Button>
          )}
          {resource.resource_type === "download" && isSafeUrl(resource.file_url) && (
            <Button asChild size="sm" className="w-full sm:w-auto">
              <a href={resource.file_url} target="_blank" rel="noopener noreferrer">
                Download
                <Download className="h-3.5 w-3.5 ml-2" />
              </a>
            </Button>
          )}
          {resource.resource_type === "website" && isSafeUrl(resource.external_url) && (
            <Button asChild size="sm" className="w-full sm:w-auto">
              <a href={resource.external_url} target="_blank" rel="noopener noreferrer">
                Visit Website
                <ExternalLink className="h-3.5 w-3.5 ml-2" />
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
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground mb-2">Content Hub</h1>
          <p className="text-muted-foreground">
            Articles, videos, websites, and downloadable resources all in one place
          </p>
        </div>

        <div className="mb-8 space-y-3">
          {/* Search bar */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Search resources..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Type filter pills */}
          <div className="flex flex-wrap gap-2">
            {[
              { value: "all", label: "All" },
              { value: "article", label: "Articles", icon: FileText },
              { value: "video", label: "Videos", icon: Video },
              { value: "website", label: "Websites", icon: Globe },
              { value: "download", label: "Downloads", icon: Download },
            ].map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                onClick={() => setSelectedType(value)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors border ${
                  selectedType === value
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background text-muted-foreground border-border hover:border-primary/50 hover:text-foreground"
                }`}
              >
                {Icon && <Icon className="h-3.5 w-3.5" />}
                {label}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredResources && filteredResources.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredResources.map((resource) => renderResourceCard(resource))}
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
