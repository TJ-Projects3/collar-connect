import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { JobFormModal } from "./JobFormModal";
import { format } from "date-fns";
import { useAdminJobs, useCreateJob, useUpdateJob, useDeleteJob, type Job } from "@/hooks/useAdminJobs";

const careerLevelLabels: Record<string, string> = {
  internship: "Internship",
  entry_level: "Entry Level",
  associate: "Associate",
  mid_senior: "Mid-Senior",
  director: "Director",
  executive: "Executive",
};

const workArrangementLabels: Record<string, string> = {
  remote: "Remote",
  hybrid: "Hybrid",
  on_site: "On-site",
};

const careerLevelColors: Record<string, string> = {
  internship: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  entry_level: "bg-green-500/10 text-green-500 border-green-500/20",
  associate: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  mid_senior: "bg-orange-500/10 text-orange-500 border-orange-500/20",
  director: "bg-red-500/10 text-red-500 border-red-500/20",
  executive: "bg-yellow-500/10 text-yellow-700 border-yellow-500/20",
};

export const JobsTab = () => {
  const { data: jobs = [], isLoading } = useAdminJobs();
  const createJob = useCreateJob();
  const updateJob = useUpdateJob();
  const deleteJob = useDeleteJob();

  const [filterCareerLevel, setFilterCareerLevel] = useState<string>("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<Job | null>(null);

  const filteredJobs = filterCareerLevel === "all"
    ? jobs
    : jobs.filter((j) => j.career_level === filterCareerLevel);

  const handleCreate = () => {
    setEditingJob(null);
    setIsModalOpen(true);
  };

  const handleEdit = (job: Job) => {
    setEditingJob(job);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    deleteJob.mutate(id);
  };

  const handleTogglePublish = (job: Job) => {
    updateJob.mutate({ id: job.id, is_published: !job.is_published });
  };

  const handleSubmit = (data: any) => {
    const jobData = {
      title: data.title,
      description: data.description || null,
      company: data.company,
      location: data.location || null,
      career_level: data.career_level,
      work_arrangement: data.work_arrangement,
      external_url: data.external_url || null,
      is_published: data.is_published ?? false,
    };

    if (editingJob) {
      updateJob.mutate({ id: editingJob.id, ...jobData });
    } else {
      createJob.mutate(jobData);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Select value={filterCareerLevel} onValueChange={setFilterCareerLevel}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by level" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Levels</SelectItem>
            {Object.entries(careerLevelLabels).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Create Job
        </Button>
      </div>

      <div className="rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Company</TableHead>
              <TableHead>Level</TableHead>
              <TableHead>Arrangement</TableHead>
              <TableHead>Location</TableHead>
              <TableHead className="text-center">Published</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredJobs.map((job) => (
              <TableRow key={job.id}>
                <TableCell className="font-medium max-w-[200px] truncate">
                  {job.title}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {job.company}
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={careerLevelColors[job.career_level]}>
                    {careerLevelLabels[job.career_level]}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">
                    {workArrangementLabels[job.work_arrangement]}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {job.location || "—"}
                </TableCell>
                <TableCell className="text-center">
                  <Switch
                    checked={job.is_published ?? false}
                    onCheckedChange={() => handleTogglePublish(job)}
                  />
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {format(new Date(job.created_at), "MMM d, yyyy")}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(job)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(job.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {filteredJobs.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  No jobs found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <JobFormModal
        job={editingJob}
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onSubmit={handleSubmit}
      />
    </div>
  );
};
