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
  resolveResumeUrl, getStoredFileName,
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
  const [resumeBusy, setResumeBusy] = useState<null | "view" | "download">(null);

  const runResumeAction = async (mode: "view" | "download") => {
    setResumeBusy(mode);
    try {
      if (mode === "view") await openResumeInNewTab(resumeUrl);
      else await downloadResume(resumeUrl);
    } catch (e) {
      toast({
        title: mode === "view" ? "Couldn't open the resume" : "Couldn't download the resume",
        description: resumeErrorMessage(e),
        variant: "destructive",
      });
    } finally {
      setResumeBusy(null);
    }
  };



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

  useEffect(() => {
    if (!open || !profile) return;
    form.reset({
      github_url: profile.github_url ?? "",
      linkedin_url: profile.linkedin_url ?? "",
      portfolio_url: profile.portfolio_url ?? "",
      featured_projects: [],
    });
    setResumeUrl(profile.resume_url ?? null);
    setResumeName(profile.resume_url ? getStoredFileName(profile.resume_url) : null);

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

  const onSubmit = async (data: PortfolioFormData) => {
    if (!user?.id) return;
    setSaving(true);
    try {
      const payload = {
        github_url: normalizeGithubUrl(data.github_url) || null,
        linkedin_url: normalizeUrl(data.linkedin_url) || null,
        portfolio_url: normalizeUrl(data.portfolio_url) || null,
        resume_url: resumeUrl || null,
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
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => runResumeAction("view")}
                        className="text-xs text-primary hover:underline disabled:opacity-60"
                        disabled={resumeBusy !== null}
                      >
                        {resumeBusy === "view" ? "Opening…" : "View file"}
                      </button>
                      <button
                        type="button"
                        onClick={() => runResumeAction("download")}
                        className="text-xs text-primary hover:underline disabled:opacity-60"
                        disabled={resumeBusy !== null}
                      >
                        {resumeBusy === "download" ? "Downloading…" : "Download"}
                      </button>
                    </div>

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

            <p className="text-xs text-muted-foreground">
              Manage your project showcase from the Projects tab on your profile.
            </p>



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
