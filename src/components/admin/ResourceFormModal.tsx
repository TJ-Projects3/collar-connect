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

const resourceSchema = z.object({
  title: z.string().min(1, "Title is required"),
  resource_type: z.enum(["article", "video", "download", "website"]),
  description: z.string().optional(),
  content: z.string().optional(),
  company: z.string().optional(),
  location: z.string().optional(),
  external_url: z.string()
    .url()
    .refine((url) => {
      if (!url) return true;
      try {
        const parsed = new URL(url);
        return ['http:', 'https:'].includes(parsed.protocol);
      } catch {
        return false;
      }
    }, { message: "Only HTTP and HTTPS URLs are allowed" })
    .optional()
    .or(z.literal("")),
  file_url: z.string()
    .url()
    .refine((url) => {
      if (!url) return true;
      try {
        const parsed = new URL(url);
        return ['http:', 'https:'].includes(parsed.protocol);
      } catch {
        return false;
      }
    }, { message: "Only HTTP and HTTPS URLs are allowed" })
    .optional()
    .or(z.literal("")),
  image_url: z.string()
    .url()
    .refine((url) => {
      if (!url) return true;
      try {
        const parsed = new URL(url);
        return ['http:', 'https:'].includes(parsed.protocol);
      } catch {
        return false;
      }
    }, { message: "Only HTTP and HTTPS URLs are allowed" })
    .optional()
    .or(z.literal("")),
  tags: z.string().optional(),
  is_published: z.boolean(),
  is_featured: z.boolean(),
});

type ResourceFormData = z.infer<typeof resourceSchema>;

interface Resource {
  id: string;
  title: string;
  resource_type: string;
  description: string | null;
  content: string | null;
  company: string | null;
  location: string | null;
  external_url: string | null;
  file_url: string | null;
  image_url: string | null;
  tags: string[] | null;
  is_published: boolean | null;
  is_featured: boolean | null;
}

interface ResourceFormModalProps {
  resource: Resource | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: ResourceFormData) => void;
}

export const ResourceFormModal = ({
  resource,
  open,
  onOpenChange,
  onSubmit,
}: ResourceFormModalProps) => {
  const form = useForm<ResourceFormData>({
    resolver: zodResolver(resourceSchema),
    defaultValues: {
      title: resource?.title || "",
      resource_type: (resource?.resource_type as "article" | "video" | "download" | "website") || "article",
      description: resource?.description || "",
      content: resource?.content || "",
      company: resource?.company || "",
      location: resource?.location || "",
      external_url: resource?.external_url || "",
      file_url: resource?.file_url || "",
      image_url: resource?.image_url || "",
      tags: resource?.tags?.join(", ") || "",
      is_published: resource?.is_published ?? false,
      is_featured: resource?.is_featured ?? false,
    },
  });

  const resourceType = form.watch("resource_type");

  // Reset form when resource prop changes (for editing)
  useEffect(() => {
    if (resource) {
      form.reset({
        title: resource.title || "",
        resource_type: (resource.resource_type as "article" | "video" | "download" | "website") || "article",
        description: resource.description || "",
        content: resource.content || "",
        company: resource.company || "",
        location: resource.location || "",
        external_url: resource.external_url || "",
        file_url: resource.file_url || "",
        image_url: resource.image_url || "",
        tags: resource.tags?.join(", ") || "",
        is_published: resource.is_published ?? false,
        is_featured: resource.is_featured ?? false,
      });
    } else {
      form.reset({
        title: "",
        resource_type: "article",
        description: "",
        content: "",
        company: "",
        location: "",
        external_url: "",
        file_url: "",
        image_url: "",
        tags: "",
        is_published: false,
        is_featured: false,
      });
    }
  }, [resource, form]);

  const handleSubmit = (data: ResourceFormData) => {
    onSubmit(data);
    onOpenChange(false);
    form.reset();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {resource ? "Edit Resource" : "Create Resource"}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title *</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="resource_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="article">Article</SelectItem>
                      <SelectItem value="video">Video</SelectItem>
                      <SelectItem value="download">Download</SelectItem>
                      <SelectItem value="website">Website</SelectItem>
                    </SelectContent>
                  </Select>
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
                    <Textarea {...field} rows={3} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {resourceType === "article" && (
              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Content</FormLabel>
                    <FormControl>
                      <Textarea {...field} rows={6} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="external_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>External URL</FormLabel>
                  <FormControl>
                    <Input {...field} type="url" placeholder="https://..." />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {resourceType === "download" && (
              <FormField
                control={form.control}
                name="file_url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>File URL</FormLabel>
                    <FormControl>
                      <Input {...field} type="url" placeholder="https://..." />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {resourceType === "video" && (
              <FormField
                control={form.control}
                name="image_url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Thumbnail URL</FormLabel>
                    <FormControl>
                      <Input {...field} type="url" placeholder="https://..." />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="tags"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tags (comma-separated)</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="tech, diversity, inclusion" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-6">
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

              <FormField
                control={form.control}
                name="is_featured"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-2">
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel className="!mt-0">Featured</FormLabel>
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit">
                {resource ? "Update" : "Create"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
