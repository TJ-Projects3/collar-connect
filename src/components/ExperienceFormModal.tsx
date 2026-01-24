import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  useAddExperience,
  useUpdateExperience,
  type Experience,
  type ExperienceInput,
} from "@/hooks/useExperiences";

const experienceSchema = z.object({
  title: z.string().min(1, "Job title is required").max(100),
  company: z.string().min(1, "Company is required").max(100),
  description: z.string().max(1000).optional().or(z.literal("")),
  start_date: z.string().min(1, "Start date is required"),
  end_date: z.string().optional().or(z.literal("")),
  is_current: z.boolean().default(false),
  location: z.string().max(100).optional().or(z.literal("")),
});

type ExperienceFormData = z.infer<typeof experienceSchema>;

interface ExperienceFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  experience?: Experience | null;
}

export const ExperienceFormModal = ({
  open,
  onOpenChange,
  experience,
}: ExperienceFormModalProps) => {
  const { toast } = useToast();
  const addExperience = useAddExperience();
  const updateExperience = useUpdateExperience();

  const isEditing = !!experience;

  const form = useForm<ExperienceFormData>({
    resolver: zodResolver(experienceSchema),
    defaultValues: {
      title: "",
      company: "",
      description: "",
      start_date: "",
      end_date: "",
      is_current: false,
      location: "",
    },
  });

  useEffect(() => {
    if (open && experience) {
      form.reset({
        title: experience.title,
        company: experience.company,
        description: experience.description || "",
        start_date: experience.start_date,
        end_date: experience.end_date || "",
        is_current: experience.is_current,
        location: experience.location || "",
      });
    } else if (open && !experience) {
      form.reset({
        title: "",
        company: "",
        description: "",
        start_date: "",
        end_date: "",
        is_current: false,
        location: "",
      });
    }
  }, [open, experience, form]);

  const onSubmit = async (data: ExperienceFormData) => {
    try {
      const input: ExperienceInput = {
        title: data.title,
        company: data.company,
        description: data.description || null,
        start_date: data.start_date,
        end_date: data.is_current ? null : data.end_date || null,
        is_current: data.is_current,
        location: data.location || null,
      };

      if (isEditing && experience) {
        await updateExperience.mutateAsync({ id: experience.id, ...input });
        toast({
          title: "Experience updated",
          description: "Your experience has been updated successfully.",
        });
      } else {
        await addExperience.mutateAsync(input);
        toast({
          title: "Experience added",
          description: "Your experience has been added successfully.",
        });
      }

      onOpenChange(false);
    } catch (error) {
      console.error("Failed to save experience:", error);
      toast({
        title: "Error",
        description: "Failed to save experience. Please try again.",
        variant: "destructive",
      });
    }
  };

  const isSubmitting = addExperience.isPending || updateExperience.isPending;
  const isCurrent = form.watch("is_current");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Experience" : "Add Experience"}</DialogTitle>
          <DialogDescription>
            {isEditing ? "Update your work experience details." : "Add a new work experience to your profile."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Job Title <span className="text-destructive">*</span></FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Software Engineer" {...field} />
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
                  <FormLabel>Company <span className="text-destructive">*</span></FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., TechCorp" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., San Francisco, CA" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="start_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Date <span className="text-destructive">*</span></FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="end_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} disabled={isCurrent} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="is_current"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>I currently work here</FormLabel>
                  </div>
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
                    <Textarea
                      placeholder="Describe your responsibilities and achievements..."
                      className="resize-none"
                      rows={4}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : isEditing ? (
                "Update Experience"
              ) : (
                "Add Experience"
              )}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
