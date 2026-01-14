import { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, Loader2 } from "lucide-react";
import { usePosts } from "@/hooks/usePosts";
import { useAllProfiles } from "@/hooks/useAllProfiles";
import { useJobs } from "@/hooks/useJobs";
import { useResources } from "@/hooks/useResources";
import { Link } from "react-router-dom";

interface SearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const SearchDialog = ({ open, onOpenChange }: SearchDialogProps) => {
  const [query, setQuery] = useState("");
  const { data: posts } = usePosts();
  const { data: profiles } = useAllProfiles();
  const { data: jobs } = useJobs();
  const { data: resources } = useResources();

  // Search across all data
  const results = useMemo(() => {
    if (!query.trim()) return { posts: [], profiles: [], jobs: [], resources: [] };

    const lowerQuery = query.toLowerCase();

    const matchedPosts =
      posts?.filter(
        (post) =>
          post.content?.toLowerCase().includes(lowerQuery) ||
          post.profiles?.full_name?.toLowerCase().includes(lowerQuery)
      ) || [];

    const matchedProfiles =
      profiles?.filter(
        (profile) =>
          profile.full_name?.toLowerCase().includes(lowerQuery) ||
          profile.job_title?.toLowerCase().includes(lowerQuery) ||
          profile.company?.toLowerCase().includes(lowerQuery)
      ) || [];

    const matchedJobs =
      jobs?.filter(
        (job) =>
          job.title.toLowerCase().includes(lowerQuery) ||
          job.company.toLowerCase().includes(lowerQuery) ||
          job.description?.toLowerCase().includes(lowerQuery)
      ) || [];

    const matchedResources =
      resources?.filter(
        (resource) =>
          resource.title.toLowerCase().includes(lowerQuery) ||
          resource.description?.toLowerCase().includes(lowerQuery)
      ) || [];

    return {
      posts: matchedPosts.slice(0, 5),
      profiles: matchedProfiles.slice(0, 5),
      jobs: matchedJobs.slice(0, 5),
      resources: matchedResources.slice(0, 5),
    };
  }, [query, posts, profiles, jobs, resources]);

  const totalResults =
    results.posts.length +
    results.profiles.length +
    results.jobs.length +
    results.resources.length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Search</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search posts, people, jobs, resources..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9"
              autoFocus
            />
          </div>

          {/* Results */}
          {query.trim() ? (
            <div className="space-y-6">
              {totalResults === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">
                    No results found for "{query}"
                  </p>
                </div>
              ) : (
                <>
                  {/* Posts */}
                  {results.posts.length > 0 && (
                    <div className="space-y-2">
                      <h3 className="font-semibold text-sm">Posts</h3>
                      {results.posts.map((post) => (
                        <Link
                          key={post.id}
                          to={`/feed?postId=${post.id}`}
                          onClick={() => onOpenChange(false)}
                        >
                          <Card className="cursor-pointer hover:bg-muted/50">
                            <CardContent className="p-3">
                              <p className="text-sm line-clamp-2">{post.content}</p>
                              <p className="text-xs text-muted-foreground mt-1">
                                by {post.profiles?.full_name || "Unknown"}
                              </p>
                            </CardContent>
                          </Card>
                        </Link>
                      ))}
                    </div>
                  )}

                  {/* Profiles */}
                  {results.profiles.length > 0 && (
                    <div className="space-y-2">
                      <h3 className="font-semibold text-sm">People</h3>
                      {results.profiles.map((profile) => (
                        <Link
                          key={profile.id}
                          to={`/profile?userId=${profile.id}`}
                          onClick={() => onOpenChange(false)}
                        >
                          <Card className="cursor-pointer hover:bg-muted/50">
                            <CardContent className="p-3">
                              <div className="flex items-center gap-3">
                                <Avatar className="h-8 w-8">
                                  <AvatarImage
                                    src={profile.avatar_url || undefined}
                                  />
                                  <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                                    {profile.full_name?.[0]?.toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium truncate">
                                    {profile.full_name}
                                  </p>
                                  <p className="text-xs text-muted-foreground truncate">
                                    {profile.job_title || "No title"}
                                    {profile.company && ` at ${profile.company}`}
                                  </p>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </Link>
                      ))}
                    </div>
                  )}

                  {/* Jobs */}
                  {results.jobs.length > 0 && (
                    <div className="space-y-2">
                      <h3 className="font-semibold text-sm">Jobs</h3>
                      {results.jobs.map((job) => (
                        <Link
                          key={job.id}
                          to={`/jobs?search=${encodeURIComponent(job.title)}`}
                          onClick={() => onOpenChange(false)}
                        >
                          <Card className="cursor-pointer hover:bg-muted/50">
                            <CardContent className="p-3">
                              <p className="text-sm font-medium truncate">
                                {job.title}
                              </p>
                              <p className="text-xs text-muted-foreground truncate">
                                {job.company}
                              </p>
                            </CardContent>
                          </Card>
                        </Link>
                      ))}
                    </div>
                  )}

                  {/* Resources */}
                  {results.resources.length > 0 && (
                    <div className="space-y-2">
                      <h3 className="font-semibold text-sm">Resources</h3>
                      {results.resources.map((resource) => (
                        <Link
                          key={resource.id}
                          to={`/content-hub?search=${encodeURIComponent(resource.title)}`}
                          onClick={() => onOpenChange(false)}
                        >
                          <Card className="cursor-pointer hover:bg-muted/50">
                            <CardContent className="p-3">
                              <p className="text-sm font-medium truncate">
                                {resource.title}
                              </p>
                              <p className="text-xs text-muted-foreground truncate">
                                {resource.description}
                              </p>
                            </CardContent>
                          </Card>
                        </Link>
                      ))}
                    </div>
                  )}

                  {/* See more buttons */}
                  <div className="text-center text-sm pt-2">
                    <p className="text-muted-foreground">
                      Showing {totalResults} result{totalResults !== 1 ? "s" : ""}
                    </p>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Start typing to search across posts, people, jobs, and resources
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
