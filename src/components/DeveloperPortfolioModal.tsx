import { useEffect, useRef, useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Github, Linkedin, Globe, FileText, Upload, Trash2, Plus, X, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import {
  portfolioSchema, type PortfolioFormData, type FeaturedProject,
  normalizeGithubUrl, normalizeUrl, validateResumeFile,
} from "@/lib/portfolio-validation";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: any;
}

const newProject = (): FeaturedProject => ({
  id: crypto.randomUUID(),
  title: "",
  description: "",
  tech_stack: [],
  live_url: "",
  repo_url: "",
});

export const DeveloperPortfolioModal = ({ open, onOpenChange, profile }: Props) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [resumeUrl, setResumeUrl] = useState<string | null>(null);
  const [resumeName, setResumeName] = useState<string | null>(null);
  const [techInputs, setTechInputs] = useState<Record<number, string>>({});

  const form = useForm<PortfolioFormData>({
    resolver: zodResolver(portfolioSchema),
    mode: "onChange",
    defaultValues: {
      github_url: "",
      linkedin_url: "",
      portfolio_url: "",
      featured_projects: [],
    },
  });

  const { fields, append, remove, update } = useFieldArray({
    control: form.control,
    name: "featured_projects",
  });

  useEffect(() => {
    if (!open || !profile) return;
    const projects = Array.isArray(profile.featured_projects) ? profile.featured_projects : [];
    form.reset({
      github_url: profile.github_url ?? "",
      linkedin_url: profile.linkedin_url ?? "",
      portfolio_url: profile.portfolio_url ?? "",
      featured_projects: projects.map((p: any) => ({
        id: p.id ?? crypto.randomUUID(),
        title: p.title ?? "",
        description: p.description ?? "",
        tech_stack: Array.isArray(p.tech_stack) ? p.tech_stack : [],
        live_url: p.live_url ?? "",
        repo_url: p.repo_url ?? "",
      })),
    });
    setResumeUrl(profile.resume_url ?? null);
    setResumeName(profile.resume_url ? decodeURIComponent(profile.resume_url.split("/").pop() ?? "resume") : null);
    setTechInputs({});
  }, [open, profile, form]);

  const handleFile = async (file: File) => {
    if (!user?.id) return;
    const err = validateResumeFile(file);
    if (err) {
      toast({ title: "Invalid file", description: err, variant: "destructive" });
      return;
    }
    try {
      setUploading(true);
      const ext = file.name.split(".").pop()?.toLowerCase();
      const path = `${user.id}/resume-${Date.now()}.${ext}`;
      const { error: uploadErr } = await supabase.storage
        .from("resumes")
        .upload(path, file, { upsert: true, contentType: file.type });
      if (uploadErr) throw uploadErr;
      const { data: { publicUrl } } = supabase.storage.from("resumes").getPublicUrl(path);
      setResumeUrl(publicUrl);
      setResumeName(file.name);
      toast({ title: "Resume uploaded" });
    } catch (e: any) {
      toast({ title: "Upload failed", description: e.message ?? "Please try again.", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const removeResume = () => {
    setResumeUrl(null);
    setResumeName(null);
  };

  const addTech = (index: number) => {
    const raw = (techInputs[index] ?? "").trim();
    if (!raw) return;
    const current = form.getValues(`featured_projects.${index}.tech_stack`) ?? [];
    if (current.includes(raw) || current.length >= 15) {
      setTechInputs((s) => ({ ...s, [index]: "" }));
      return;
    }
    update(index, { ...form.getValues(`featured_projects.${index}`), tech_stack: [...current, raw] });
    setTechInputs((s) => ({ ...s, [index]: "" }));
  };

  const removeTech = (index: number, tech: string) => {
    const current = form.getValues(`featured_projects.${index}.tech_stack`) ?? [];
    update(index, {
      ...form.getValues(`featured_projects.${index}`),
      tech_stack: current.filter((t) => t !== tech),
    });
  };

  const onSubmit = async (data: PortfolioFormData) => {
    if (!user?.id) return;
    setSaving(true);
    try {
      const payload = {
        github_url: normalizeGithubUrl(data.github_url) || null,
        linkedin_url: normalizeUrl(data.linkedin_url) || null,
        portfolio_url: normalizeUrl(data.portfolio_url) || null,
        resume_url: resumeUrl || null,
        featured_projects: data.featured_projects.map((p) => ({
          ...p,
          live_url: normalizeUrl(p.live_url ?? ""),
          repo_url: normalizeUrl(p.repo_url ?? ""),
        })) as any,
      };
      const { error } = await supabase
        .from("profiles")
        .update(payload)
        .eq("id", user.id);
      if (error) throw error;
      await qc.invalidateQueries({ queryKey: ["profile"] });
      toast({ title: "Portfolio saved" });
      onOpenChange(false);
    } catch (e: any) {
      toast({ title: "Save failed", description: e.message ?? "Please try again.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const canAddProject = fields.length < 3;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[640px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Developer Portfolio & Links</DialogTitle>
          <DialogDescription>
            Showcase your work, links, and resume to stand out.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 mt-2">
            {/* Links */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Social & Professional Links
              </h3>
              <FormField
                control={form.control}
                name="github_url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2"><Github className="h-4 w-4" /> GitHub</FormLabel>
                    <FormControl>
                      <Input placeholder="https://github.com/username" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="linkedin_url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2"><Linkedin className="h-4 w-4" /> LinkedIn</FormLabel>
                    <FormControl>
                      <Input placeholder="https://linkedin.com/in/username" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="portfolio_url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2"><Globe className="h-4 w-4" /> Personal Portfolio</FormLabel>
                    <FormControl>
                      <Input placeholder="https://yourdomain.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Resume */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Resume / CV
              </h3>
              {resumeUrl ? (
                <div className="flex items-center gap-3 p-3 border rounded-lg bg-muted/30">
                  <FileText className="h-8 w-8 text-primary flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{resumeName ?? "Resume"}</p>
                    <a href={resumeUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline">
                      View file
                    </a>
                  </div>
                  <Button type="button" variant="ghost" size="icon" onClick={removeResume}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ) : (
                <div
                  onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                  onDragLeave={() => setDragActive(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                    dragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50"
                  }`}
                >
                  {uploading ? (
                    <Loader2 className="h-8 w-8 mx-auto animate-spin text-muted-foreground" />
                  ) : (
                    <>
                      <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                      <p className="text-sm font-medium">Drop your resume here or click to browse</p>
                      <p className="text-xs text-muted-foreground mt-1">PDF, DOC, DOCX · Max 5MB</p>
                    </>
                  )}
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFile(f);
                  e.target.value = "";
                }}
              />
            </div>

            {/* Projects */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  Featured Projects ({fields.length}/3)
                </h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => append(newProject())}
                  disabled={!canAddProject}
                >
                  <Plus className="h-4 w-4 mr-1" /> Add Project
                </Button>
              </div>

              {fields.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4 border border-dashed rounded-lg">
                  No projects yet. Add up to 3 to showcase your work.
                </p>
              )}

              {fields.map((field, index) => (
                <div key={field.id} className="border rounded-lg p-4 space-y-3 relative">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold">Project {index + 1}</span>
                    <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => remove(index)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                  <FormField
                    control={form.control}
                    name={`featured_projects.${index}.title`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Title *</FormLabel>
                        <FormControl><Input placeholder="Project name" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`featured_projects.${index}.description`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl><Textarea rows={2} placeholder="What does it do?" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Tech stack */}
                  <div>
                    <FormLabel>Tech Stack</FormLabel>
                    <div className="flex flex-wrap gap-2 mt-2 mb-2">
                      {(form.watch(`featured_projects.${index}.tech_stack`) ?? []).map((t) => (
                        <Badge key={t} variant="secondary" className="gap-1">
                          {t}
                          <button type="button" onClick={() => removeTech(index, t)}>
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Add tech and press Enter"
                        value={techInputs[index] ?? ""}
                        onChange={(e) => setTechInputs((s) => ({ ...s, [index]: e.target.value }))}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            addTech(index);
                          }
                        }}
                      />
                      <Button type="button" variant="outline" onClick={() => addTech(index)}>Add</Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <FormField
                      control={form.control}
                      name={`featured_projects.${index}.live_url`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Live URL</FormLabel>
                          <FormControl><Input placeholder="https://..." {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`featured_projects.${index}.repo_url`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Repo URL</FormLabel>
                          <FormControl><Input placeholder="https://github.com/..." {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit" disabled={saving || !form.formState.isValid}>
                {saving ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</>) : "Save Portfolio"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
