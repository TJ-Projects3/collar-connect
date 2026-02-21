import { useState, useMemo, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, MapPin, Building2, ExternalLink, Loader2, Filter, X } from "lucide-react";
import { differenceInDays, differenceInHours } from "date-fns";
import { useJobs } from "@/hooks/useJobs";
import { useSearchParams } from "react-router-dom";

const careerLevelLabels: Record<string, string> = {
  internship: "Internship",
  entry_level: "Entry Level",
  associate: "Associate",
  mid_senior: "Mid-Senior Level",
  director: "Director",
  executive: "Executive",
};

const workArrangementLabels: Record<string, string> = {
  remote: "Remote",
  hybrid: "Hybrid",
  on_site: "On-site",
};

const Jobs = () => {
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(() => searchParams.get("search") || "");
  const [selectedCareerLevels, setSelectedCareerLevels] = useState<string[]>([]);
  const [selectedWorkArrangements, setSelectedWorkArrangements] = useState<string[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);

  const { data: jobs, isLoading } = useJobs();

  useEffect(() => {
    const incoming = searchParams.get("search") || "";
    setSearchQuery(incoming);
  }, [searchParams]);

  // Get unique locations from jobs
  const uniqueLocations = useMemo(() => {
    if (!jobs) return [];
    const locations = jobs
      .map((job) => job.location)
      .filter((loc): loc is string => Boolean(loc));
    return [...new Set(locations)].sort();
  }, [jobs]);

  // Filter jobs based on search and filters
  const filteredJobs = useMemo(() => {
    if (!jobs) return [];

    return jobs.filter((job) => {
      // Search filter
      const matchesSearch =
        searchQuery === "" ||
        job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.description?.toLowerCase().includes(searchQuery.toLowerCase());

      // Career level filter
      const matchesCareerLevel =
        selectedCareerLevels.length === 0 ||
        selectedCareerLevels.includes(job.career_level);

      // Work arrangement filter
      const matchesWorkArrangement =
        selectedWorkArrangements.length === 0 ||
        selectedWorkArrangements.includes(job.work_arrangement);

      // Location filter
      const matchesLocation =
        selectedLocation === "all" || job.location === selectedLocation;

      return matchesSearch && matchesCareerLevel && matchesWorkArrangement && matchesLocation;
    });
  }, [jobs, searchQuery, selectedCareerLevels, selectedWorkArrangements, selectedLocation]);

  const toggleCareerLevel = (level: string) => {
    setSelectedCareerLevels((prev) =>
      prev.includes(level) ? prev.filter((l) => l !== level) : [...prev, level]
    );
  };

  const toggleWorkArrangement = (arrangement: string) => {
    setSelectedWorkArrangements((prev) =>
      prev.includes(arrangement)
        ? prev.filter((a) => a !== arrangement)
        : [...prev, arrangement]
    );
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedCareerLevels([]);
    setSelectedWorkArrangements([]);
    setSelectedLocation("all");
  };

  const hasActiveFilters =
    searchQuery !== "" ||
    selectedCareerLevels.length > 0 ||
    selectedWorkArrangements.length > 0 ||
    selectedLocation !== "all";

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Job Opportunities</h1>
          <p className="text-muted-foreground">
            Discover career opportunities that champion diversity and inclusion in tech
          </p>
        </div>

        {/* Search and Filter Bar */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search jobs by title, company, or keywords..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="md:w-auto"
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
            {hasActiveFilters && (
              <Badge variant="secondary" className="ml-2">
                Active
              </Badge>
            )}
          </Button>
          {hasActiveFilters && (
            <Button variant="ghost" onClick={clearFilters}>
              <X className="h-4 w-4 mr-2" />
              Clear
            </Button>
          )}
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Career Level */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Career Level</Label>
                  <div className="space-y-2">
                    {Object.entries(careerLevelLabels).map(([value, label]) => (
                      <div key={value} className="flex items-center space-x-2">
                        <Checkbox
                          id={`career-${value}`}
                          checked={selectedCareerLevels.includes(value)}
                          onCheckedChange={() => toggleCareerLevel(value)}
                        />
                        <Label
                          htmlFor={`career-${value}`}
                          className="text-sm font-normal cursor-pointer"
                        >
                          {label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Work Arrangement */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Work Arrangement</Label>
                  <div className="space-y-2">
                    {Object.entries(workArrangementLabels).map(([value, label]) => (
                      <div key={value} className="flex items-center space-x-2">
                        <Checkbox
                          id={`work-${value}`}
                          checked={selectedWorkArrangements.includes(value)}
                          onCheckedChange={() => toggleWorkArrangement(value)}
                        />
                        <Label
                          htmlFor={`work-${value}`}
                          className="text-sm font-normal cursor-pointer"
                        >
                          {label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Location */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Location</Label>
                  <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                    <SelectTrigger>
                      <SelectValue placeholder="All locations" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All locations</SelectItem>
                      {uniqueLocations.map((location) => (
                        <SelectItem key={location} value={location}>
                          {location}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Results count */}
        {!isLoading && (
          <p className="text-sm text-muted-foreground mb-4">
            {filteredJobs.length} job{filteredJobs.length !== 1 ? "s" : ""} found
          </p>
        )}

        {/* Job Listings */}
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredJobs.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredJobs.map((job) => {
              const postedLabel = job.created_at
                ? (() => {
                    const createdAt = new Date(job.created_at);
                    const days = differenceInDays(new Date(), createdAt);
                    if (days >= 1) {
                      return `Posted ${days} day${days === 1 ? "" : "s"} ago`;
                    }
                    const hours = Math.max(1, differenceInHours(new Date(), createdAt));
                    return `Posted ${hours} hour${hours === 1 ? "" : "s"} ago`;
                  })()
                : null;

              return (
                <Card
                  key={job.id}
                  className="hover:shadow-lg transition-all duration-300 rounded-xl border-border/50"
                >
                <CardHeader className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <CardTitle className="text-lg leading-tight">{job.title}</CardTitle>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Building2 className="h-4 w-4" />
                        <span className="font-medium">{job.company}</span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Badge className="justify-center" variant="secondary">
                        {careerLevelLabels[job.career_level]}
                      </Badge>
                      <Badge className="justify-center" variant="outline">
                        {workArrangementLabels[job.work_arrangement]}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                    {job.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" />
                        {job.location}
                      </span>
                    )}
                    {postedLabel && <span>{postedLabel}</span>}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {job.description && (
                    <CardDescription className="line-clamp-3">
                      {job.description}
                    </CardDescription>
                  )}
                  {job.external_url && (
                    <Button asChild className="w-full sm:w-auto">
                      <a href={job.external_url} target="_blank" rel="noopener noreferrer">
                        Apply Now
                        <ExternalLink className="h-4 w-4 ml-2" />
                      </a>
                    </Button>
                  )}
                </CardContent>
              </Card>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              {hasActiveFilters
                ? "No jobs match your filters. Try adjusting your search criteria."
                : "No job opportunities available yet."}
            </p>
          </div>
        )}
      </main>
    </div>
  );
};

export default Jobs;
