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
import {
  Search,
  MapPin,
  Building2,
  ExternalLink,
  Loader2,
  Filter,
  X,
  Mail,
  Phone,
  Link as LinkIcon,
  GraduationCap,
  Bookmark,
} from "lucide-react";
import { differenceInDays, differenceInHours } from "date-fns";
import { useJobs, type Job } from "@/hooks/useJobs";
import {
  useJobApplications,
  useUpsertJobApplication,
  useDeleteJobApplication,
  type JobApplicationStatus,
} from "@/hooks/useJobApplications";
import { ApplyConfirmDialog } from "@/components/jobs/ApplyConfirmDialog";
import { TrackerBoard } from "@/components/jobs/TrackerBoard";
import { useSearchParams } from "react-router-dom";
import { cn } from "@/lib/utils";

/** Legacy enum fallback for rows that predate the classifier. */
const careerLevelToExperience: Record<string, string> = {
  internship: "Internship",
  entry_level: "Entry Level",
  associate: "Mid Level",
  mid_senior: "Senior",
  director: "Lead/Executive",
  executive: "Lead/Executive",
};

const EXPERIENCE_LEVELS = [
  "Internship",
  "Entry Level",
  "Mid Level",
  "Senior",
  "Lead/Executive",
] as const;

const TRACKS = [
  "Software Engineering",
  "Product & Program",
  "Design & UX",
  "Data & Analytics",
  "Cybersecurity",
  "Cloud & DevOps",
  "Solutions & Sales Tech",
  "IT & Operations",
] as const;

/** Semantic-token based colors so each domain reads distinctly in both themes. */
const trackBadgeStyles: Record<string, string> = {
  "Software Engineering": "bg-primary/10 text-primary border-primary/30",
  "Product & Program": "bg-secondary/15 text-secondary border-secondary/30",
  "Design & UX": "bg-accent/15 text-accent border-accent/30",
  "Data & Analytics": "bg-success-muted text-success border-success/30",
  Cybersecurity: "bg-destructive/10 text-destructive border-destructive/30",
  "Cloud & DevOps": "bg-primary/15 text-primary border-primary/40",
  "Solutions & Sales Tech": "bg-secondary/10 text-secondary border-secondary/25",
  "IT & Operations": "bg-muted text-muted-foreground border-border",
};

const workArrangementLabels: Record<string, string> = {
  remote: "Remote",
  hybrid: "Hybrid",
  on_site: "On-site",
};

const getExperienceLevel = (job: Job): string =>
  job.experience_level || careerLevelToExperience[job.career_level] || "Mid Level";

const isEarlyCareer = (job: Job): boolean => {
  const level = getExperienceLevel(job);
  return job.is_internship || level === "Internship" || level === "Entry Level";
};

/** Only http(s) links may be rendered as hrefs (blocks javascript:/data: URLs). */
const isSafeUrl = (url: string | null | undefined): boolean => {
  if (!url) return false;
  try {
    return ["http:", "https:"].includes(new URL(url).protocol);
  } catch {
    return false;
  }
};

const Jobs = () => {
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(() => searchParams.get("search") || "");
  const [earlyCareerOnly, setEarlyCareerOnly] = useState(false);
  const [experienceLevel, setExperienceLevel] = useState<string>("all");
  const [selectedTrack, setSelectedTrack] = useState<string>("all");
  const [selectedWorkArrangements, setSelectedWorkArrangements] = useState<string[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);
  const [view, setView] = useState<"explore" | "tracker">("explore");
  const [applyPrompt, setApplyPrompt] = useState<Job | null>(null);

  const { data: jobs, isLoading } = useJobs();
  const { data: tracked, isLoading: trackedLoading } = useJobApplications();
  const upsertApplication = useUpsertJobApplication();
  const deleteApplication = useDeleteJobApplication();

  const trackedByJobId = useMemo(() => {
    const map = new Map<string, JobApplicationStatus>();
    for (const item of tracked ?? []) {
      map.set(item.job_id, item.status as JobApplicationStatus);
    }
    return map;
  }, [tracked]);

  const toggleSaved = (job: Job) => {
    if (trackedByJobId.has(job.id)) {
      deleteApplication.mutate(job.id);
    } else {
      upsertApplication.mutate({ jobId: job.id, status: "saved" });
    }
  };

  const handleApplyClick = (job: Job) => {
    setApplyPrompt(job);
  };

  useEffect(() => {
    const incoming = searchParams.get("search") || "";
    setSearchQuery(incoming);
  }, [searchParams]);

  const uniqueLocations = useMemo(() => {
    if (!jobs) return [];
    const locations = jobs
      .map((job) => job.location)
      .filter((loc): loc is string => Boolean(loc));
    return [...new Set(locations)].sort();
  }, [jobs]);

  const earlyCareerCount = useMemo(
    () => (jobs ?? []).filter(isEarlyCareer).length,
    [jobs],
  );

  const filteredJobs = useMemo(() => {
    if (!jobs) return [];

    return jobs.filter((job) => {
      const matchesSearch =
        searchQuery === "" ||
        job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.description?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesEarlyCareer = !earlyCareerOnly || isEarlyCareer(job);

      const matchesExperience =
        experienceLevel === "all" || getExperienceLevel(job) === experienceLevel;

      const matchesTrack = selectedTrack === "all" || job.track === selectedTrack;

      const matchesWorkArrangement =
        selectedWorkArrangements.length === 0 ||
        selectedWorkArrangements.includes(job.work_arrangement);

      const matchesLocation =
        selectedLocation === "all" || job.location === selectedLocation;

      return (
        matchesSearch &&
        matchesEarlyCareer &&
        matchesExperience &&
        matchesTrack &&
        matchesWorkArrangement &&
        matchesLocation
      );
    });
  }, [
    jobs,
    searchQuery,
    earlyCareerOnly,
    experienceLevel,
    selectedTrack,
    selectedWorkArrangements,
    selectedLocation,
  ]);

  const toggleWorkArrangement = (arrangement: string) => {
    setSelectedWorkArrangements((prev) =>
      prev.includes(arrangement)
        ? prev.filter((a) => a !== arrangement)
        : [...prev, arrangement]
    );
  };

  const clearFilters = () => {
    setSearchQuery("");
    setEarlyCareerOnly(false);
    setExperienceLevel("all");
    setSelectedTrack("all");
    setSelectedWorkArrangements([]);
    setSelectedLocation("all");
  };

  const hasActiveFilters =
    searchQuery !== "" ||
    earlyCareerOnly ||
    experienceLevel !== "all" ||
    selectedTrack !== "all" ||
    selectedWorkArrangements.length > 0 ||
    selectedLocation !== "all";

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground mb-2">Job Opportunities</h1>
          <p className="text-muted-foreground">
            Discover career opportunities that champion diversity and inclusion in tech
          </p>
        </div>

        {/* View toggle: Explore / My Tracker */}
        <div
          className="mb-4 inline-flex rounded-lg border border-border bg-muted/40 p-1"
          role="group"
          aria-label="Job board view"
        >
          <button
            type="button"
            onClick={() => setView("explore")}
            aria-pressed={view === "explore"}
            className={cn(
              "rounded-md px-4 py-1.5 text-sm font-medium transition-colors",
              view === "explore"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            Explore Jobs
          </button>
          <button
            type="button"
            onClick={() => setView("tracker")}
            aria-pressed={view === "tracker"}
            className={cn(
              "rounded-md px-4 py-1.5 text-sm font-medium transition-colors",
              view === "tracker"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            My Tracker ({tracked?.length ?? 0})
          </button>
        </div>

        {view === "explore" ? (
          <>
        {/* Search + primary actions */}
        <div className="flex flex-col md:flex-row gap-3 mb-4">
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
            type="button"
            variant={earlyCareerOnly ? "default" : "outline"}
            onClick={() => setEarlyCareerOnly((prev) => !prev)}
            aria-pressed={earlyCareerOnly}
            className="md:w-auto"
          >
            <GraduationCap className="h-4 w-4 mr-2" />
            Internships &amp; Early Career
            <Badge
              variant={earlyCareerOnly ? "secondary" : "outline"}
              className="ml-2"
            >
              {earlyCareerCount}
            </Badge>
          </Button>
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

        {/* Track / domain pills */}
        <div className="flex flex-wrap gap-2 mb-6" role="group" aria-label="Filter by track">
          {["all", ...TRACKS].map((track) => (
            <button
              key={track}
              type="button"
              onClick={() => setSelectedTrack(track)}
              aria-pressed={selectedTrack === track}
              className={cn(
                "rounded-full border px-3.5 py-1.5 text-sm transition-colors",
                selectedTrack === track
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              {track === "all" ? "All tracks" : track}
            </button>
          ))}
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Experience level */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Experience Level</Label>
                  <Select value={experienceLevel} onValueChange={setExperienceLevel}>
                    <SelectTrigger>
                      <SelectValue placeholder="All levels" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All levels</SelectItem>
                      {EXPERIENCE_LEVELS.map((level) => (
                        <SelectItem key={level} value={level}>
                          {level}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
              const level = getExperienceLevel(job);
              const internship = job.is_internship || level === "Internship";
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
                    <div className="flex flex-wrap justify-end gap-2 max-w-[55%]">
                      <Badge
                        className={cn(
                          "justify-center",
                          internship && "bg-success text-success-foreground hover:bg-success/90",
                        )}
                        variant={internship ? "default" : "secondary"}
                      >
                        {level}
                      </Badge>
                      {job.track && (
                        <Badge className="justify-center" variant="secondary">
                          {job.track}
                        </Badge>
                      )}
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
                    {internship && (
                      <span className="flex items-center gap-1 text-success">
                        <GraduationCap className="h-3.5 w-3.5" />
                        Great for students
                      </span>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {job.description && (
                    <CardDescription className="line-clamp-3">
                      {job.description}
                    </CardDescription>
                  )}
                  
                  {(job.contact_name || job.contact_email || job.contact_phone || job.contact_url) && (
                    <div className="space-y-2 rounded-lg border border-dashed border-border p-3 bg-muted/30">
                      <h4 className="text-sm font-medium">Point of Contact</h4>
                      <div className="space-y-1.5 text-sm">
                        {job.contact_name && (
                          <p className="text-muted-foreground">{job.contact_name}</p>
                        )}
                        {job.contact_email && (
                          <a 
                            href={`mailto:${job.contact_email}`}
                            className="flex items-center gap-2 text-primary hover:underline"
                          >
                            <Mail className="h-3.5 w-3.5" />
                            {job.contact_email}
                          </a>
                        )}
                        {job.contact_phone && (
                          <a 
                            href={`tel:${job.contact_phone}`}
                            className="flex items-center gap-2 text-primary hover:underline"
                          >
                            <Phone className="h-3.5 w-3.5" />
                            {job.contact_phone}
                          </a>
                        )}
                        {isSafeUrl(job.contact_url) && (
                          <a 
                            href={job.contact_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-primary hover:underline"
                          >
                            <LinkIcon className="h-3.5 w-3.5" />
                            Contact Page
                          </a>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {isSafeUrl(job.external_url ?? job.source_url) && (
                    <Button
                      asChild
                      className="w-full sm:w-auto"
                      onClick={() => handleApplyClick(job)}
                    >
                      <a
                        href={job.external_url ?? job.source_url ?? undefined}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
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
          </>
        ) : (
          <TrackerBoard
            items={tracked ?? []}
            isLoading={trackedLoading}
            onStatusChange={(jobId, status) =>
              upsertApplication.mutate({ jobId, status })
            }
            onNotesSave={(jobId, notes) => {
              const current = (tracked ?? []).find((t) => t.job_id === jobId);
              upsertApplication.mutate({
                jobId,
                status: (current?.status as JobApplicationStatus) ?? "saved",
                notes,
              });
            }}
            onRemove={(jobId) => deleteApplication.mutate(jobId)}
          />
        )}
      </main>

      <ApplyConfirmDialog
        open={!!applyPrompt}
        company={applyPrompt?.company ?? null}
        title={applyPrompt?.title ?? null}
        isPending={upsertApplication.isPending}
        onConfirm={() => {
          if (applyPrompt) {
            upsertApplication.mutate({ jobId: applyPrompt.id, status: "applied" });
          }
          setApplyPrompt(null);
        }}
        onDismiss={() => setApplyPrompt(null)}
      />
    </div>
  );
};

export default Jobs;
