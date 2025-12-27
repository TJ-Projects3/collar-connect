import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const jobSchema = z.object({
  title: z.string().min(1, "Title is required"),
  company: z.string().min(1, "Company is required"),
  description: z.string().optional(),
  location: z.string().optional(),
  career_level: z.enum(["internship", "entry_level", "associate", "mid_senior", "director", "executive"]),
  work_arrangement: z.enum(["remote", "hybrid", "on_site"]),
  external_url: z.string().url().optional().or(z.literal("")),
  is_published: z.boolean(),
});

type JobFormData = z.infer<typeof jobSchema>;

interface Job {
  id: string;
  title: string;
  company: string;
  description: string | null;
  location: string | null;
  career_level: "internship" | "entry_level" | "associate" | "mid_senior" | "director" | "executive";
  work_arrangement: "remote" | "hybrid" | "on_site";
  external_url: string | null;
  is_published: boolean | null;
}

interface JobFormModalProps {
  job: Job | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: JobFormData) => void;
}

const careerLevelOptions = [
  { value: "internship", label: "Internship" },
  { value: "entry_level", label: "Entry Level" },
  { value: "associate", label: "Associate" },
  { value: "mid_senior", label: "Mid-Senior Level" },
  { value: "director", label: "Director" },
  { value: "executive", label: "Executive" },
];

const workArrangementOptions = [
  { value: "remote", label: "Remote" },
  { value: "hybrid", label: "Hybrid" },
  { value: "on_site", label: "On-site" },
];

export const JobFormModal = ({
  job,
  open,
  onOpenChange,
  onSubmit,
}: JobFormModalProps) => {
  const form = useForm<JobFormData>({
    resolver: zodResolver(jobSchema),
    defaultValues: {
      title: "",
      company: "",
      description: "",
      location: "",
      career_level: "entry_level",
      work_arrangement: "on_site",
      external_url: "",
      is_published: false,
    },
  });

  // Reset form when job prop changes (for editing)
  useEffect(() => {
    if (job) {
      form.reset({
        title: job.title || "",
        company: job.company || "",
        description: job.description || "",
        location: job.location || "",
        career_level: job.career_level || "entry_level",
        work_arrangement: job.work_arrangement || "on_site",
        external_url: job.external_url || "",
        is_published: job.is_published ?? false,
      });
    } else {
      form.reset({
        title: "",
        company: "",
        description: "",
        location: "",
        career_level: "entry_level",
        work_arrangement: "on_site",
        external_url: "",
        is_published: false,
      });
    }
  }, [job, form]);

  const handleSubmit = (data: JobFormData) => {
    onSubmit(data);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {job ? "Edit Job" : "Create Job"}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Job Title *</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="e.g., Senior Software Engineer" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="company"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company *</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="e.g., TechCorp Inc." />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="career_level"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Career Level *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {careerLevelOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="work_arrangement"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Work Arrangement *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {workArrangementOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="e.g., New York, NY or Remote" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea {...field} rows={4} placeholder="Job description and requirements..." />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="external_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Application URL</FormLabel>
                  <FormControl>
                    <Input {...field} type="url" placeholder="https://..." />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="is_published"
              render={({ field }) => (
                <FormItem className="flex items-center gap-2">
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <FormLabel className="!mt-0">Published</FormLabel>
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit">
                {job ? "Update" : "Create"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
