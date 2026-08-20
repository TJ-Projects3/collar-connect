import { useEffect, useRef, useState } from "react";
import { ModalActions } from "@/components/layout/ModalActions";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ImagePlus, Loader2, Plus, Trash2, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import {
  studentProjectSchema, type StudentProjectFormData,
  normalizeProjectUrl, validateCoverImage,
} from "@/lib/project-validation";
import {
  useCreateProject, useUpdateProject, type StudentProject,
} from "@/hooks/useStudentProjects";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project?: StudentProject | null;
}

const stopSpace = (e: React.KeyboardEvent) => {
  if (e.key === " ") e.stopPropagation();
};

export const ProjectFormModal = ({ open, onOpenChange, project }: Props) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [techInput, setTechInput] = useState("");

  const createProject = useCreateProject();
  const updateProject = useUpdateProject();
  const isEditing = !!project;

  const form = useForm<StudentProjectFormData>({
    resolver: zodResolver(studentProjectSchema),
    defaultValues: {
      title: "",
      description: "",
      tech_stack: [],
      repo_url: "",
      live_url: "",
      achievement_label: "",
      share_to_feed: false,
    },
  });

  useEffect(() => {
    if (!open) return;
    form.reset({
      title: project?.title ?? "",
      description: project?.description ?? "",
      tech_stack: project?.tech_stack ?? [],
      repo_url: project?.repo_url ?? "",
      live_url: project?.live_url ?? "",
      achievement_label: project?.achievement_label ?? "",
      share_to_feed: false,
    });
    setCoverUrl(project?.cover_image_url ?? null);
    setTechInput("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, project?.id]);

  const tech = form.watch("tech_stack");

  const addTech = () => {
    const value = techInput.trim();
    if (!value) return;
    if (value.length > 30) {
      toast({ title: "Technology name too long", description: "Max 30 characters.", variant: "destructive" });
      return;
    }
    if (tech.length >= 15) {
      toast({ title: "Limit reached", description: "Max 15 technologies.", variant: "destructive" });
      return;
    }
    if (tech.some((t) => t.toLowerCase() === value.toLowerCase())) {
      setTechInput("");
      return;
    }
    form.setValue("tech_stack", [...tech, value], { shouldDirty: true });
    setTechInput("");
  };

  const removeTech = (value: string) => {
    form.setValue("tech_stack", tech.filter((t) => t !== value), { shouldDirty: true });
  };

  const handleCoverSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !user?.id) return;

    const validationError = validateCoverImage(file);
    if (validationError) {
      toast({ title: "Invalid image", description: validationError, variant: "destructive" });
      return;
    }

    setUploading(true);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
      const path = `${user.id}/projects/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage
        .from("content-images")
        .upload(path, file, { upsert: true, contentType: file.type || undefined });
      if (error) throw error;
      const { data } = supabase.storage.from("content-images").getPublicUrl(path);
      setCoverUrl(data.publicUrl);
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const onSubmit = async (values: StudentProjectFormData) => {
    const payload = {
      title: values.title.trim(),
      description: values.description?.trim() || null,
      cover_image_url: coverUrl,
      tech_stack: values.tech_stack,
      repo_url: values.repo_url ? normalizeProjectUrl(values.repo_url) : null,
      live_url: values.live_url ? normalizeProjectUrl(values.live_url) : null,
      achievement_label: values.achievement_label?.trim() || null,
    };

    if (isEditing && project) {
      await updateProject.mutateAsync({ id: project.id, project: payload });
    } else {
      await createProject.mutateAsync({ project: payload, shareToFeed: values.share_to_feed });
    }
    onOpenChange(false);
  };

  const isPending = createProject.isPending || updateProject.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit project" : "Add project"}</DialogTitle>
          <DialogDescription>
            Showcase your work to peers and recruiters. Add a cover image, tech stack, and links.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            {/* Cover image */}
            <div className="space-y-2">
              <FormLabel>Cover image</FormLabel>
              <div className="aspect-video w-full rounded-lg border border-dashed bg-muted/40 overflow-hidden flex items-center justify-center">
                {coverUrl ? (
                  <img src={coverUrl} alt="Project cover preview" className="h-full w-full object-cover" />
                ) : (
                  <span className="text-sm text-muted-foreground">No image selected</span>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="gap-2"
                >
                  {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
                  {coverUrl ? "Replace image" : "Upload image"}
                </Button>
                {coverUrl && (
                  <Button type="button" variant="ghost" size="sm" onClick={() => setCoverUrl(null)} className="gap-2">
                    <Trash2 className="h-4 w-4" /> Remove
                  </Button>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={handleCoverSelect}
              />
            </div>

            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Project title *</FormLabel>
                  <FormControl>
                    <Input placeholder="Campus Events Finder" {...field} onKeyDownCapture={stopSpace} />
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
                    <Textarea
                      rows={4}
                      placeholder="What it does, what you built, and the impact."
                      {...field}
                      onKeyDownCapture={stopSpace}
                    />
                  </FormControl>
                  <FormDescription>{(field.value || "").length}/500</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Tech stack */}
            <FormField
              control={form.control}
              name="tech_stack"
              render={() => (
                <FormItem>
                  <FormLabel>Tech stack</FormLabel>
                  <div className="flex gap-2">
                    <Input
                      value={techInput}
                      placeholder="React, Supabase, TypeScript..."
                      onChange={(e) => setTechInput(e.target.value)}
                      onKeyDownCapture={stopSpace}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addTech();
                        }
                      }}
                    />
                    <Button type="button" variant="outline" onClick={addTech} className="gap-1">
                      <Plus className="h-4 w-4" /> Add
                    </Button>
                  </div>
                  {tech.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-2">
                      {tech.map((t) => (
                        <Badge key={t} variant="secondary" className="gap-1">
                          {t}
                          <button
                            type="button"
                            onClick={() => removeTech(t)}
                            aria-label={`Remove ${t}`}
                            className="hover:text-destructive"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="repo_url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>GitHub repository</FormLabel>
                    <FormControl>
                      <Input placeholder="https://github.com/you/project" {...field} onKeyDownCapture={stopSpace} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="live_url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Live demo</FormLabel>
                    <FormControl>
                      <Input placeholder="https://yourproject.app" {...field} onKeyDownCapture={stopSpace} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="achievement_label"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Achievement (optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Hackathon Winner — MLH 2026" {...field} onKeyDownCapture={stopSpace} />
                  </FormControl>
                  <FormDescription>
                    Shows as a pending badge until an admin verifies it.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {!isEditing && (
              <FormField
                control={form.control}
                name="share_to_feed"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start gap-3 rounded-lg border p-3">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} className="mt-0.5" />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="cursor-pointer">Also share to the Community Feed</FormLabel>
                      <FormDescription>
                        Peers and recruiters can like, comment, and give feedback.
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
            )}

            <ModalActions
              type="submit"
              submitLabel={isEditing ? "Save changes" : "Add project"}
              pendingLabel={isEditing ? "Saving..." : "Adding..."}
              onCancel={() => onOpenChange(false)}
              isPending={isPending || uploading}
              className="pt-2"
            />
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
