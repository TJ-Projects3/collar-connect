import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";


const urlOrEmpty = z
  .string()
  .trim()
  .max(500, "URL too long")
  .refine((v) => v === "" || /^https?:\/\/.+\..+/i.test(v), {
    message: "Please enter a valid URL (must start with http:// or https://)",
  });

export const githubUrlSchema = z
  .string()
  .trim()
  .max(500)
  .refine(
    (v) =>
      v === "" ||
      /^https?:\/\/(www\.)?github\.com\/[A-Za-z0-9_.-]+\/?$/i.test(v),
    { message: "Please enter a valid GitHub profile URL (https://github.com/username)" }
  );

export const linkedinUrlSchema = z
  .string()
  .trim()
  .max(500)
  .refine(
    (v) =>
      v === "" ||
      /^https?:\/\/(www\.)?linkedin\.com\/.+/i.test(v),
    { message: "Please enter a valid LinkedIn URL (https://linkedin.com/in/...)" }
  );

export const projectSchema = z.object({
  id: z.string(),
  title: z.string().trim().min(1, "Title is required").max(100, "Max 100 chars"),
  description: z.string().trim().max(500, "Max 500 chars").optional().or(z.literal("")),
  tech_stack: z.array(z.string().trim().max(30)).max(15, "Max 15 items"),
  live_url: urlOrEmpty.optional().or(z.literal("")),
  repo_url: urlOrEmpty.optional().or(z.literal("")),
});

export const portfolioSchema = z.object({
  github_url: githubUrlSchema,
  linkedin_url: linkedinUrlSchema,
  portfolio_url: urlOrEmpty,
  featured_projects: z.array(projectSchema).max(3, "Maximum 3 projects allowed"),
});

export type PortfolioFormData = z.infer<typeof portfolioSchema>;
export type FeaturedProject = z.infer<typeof projectSchema>;

// Normalize a github URL: accept github.com/x or https://github.com/x
export function normalizeGithubUrl(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (/^github\.com\//i.test(trimmed)) return `https://${trimmed}`;
  return trimmed;
}

export function normalizeUrl(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

export const ALLOWED_RESUME_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];
export const ALLOWED_RESUME_EXTS = ["pdf", "doc", "docx"];
export const MAX_RESUME_BYTES = 5 * 1024 * 1024;

export function validateResumeFile(file: File): string | null {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (!ALLOWED_RESUME_EXTS.includes(ext)) {
    return "Only PDF, DOC, or DOCX files are allowed.";
  }
  if (file.type && !ALLOWED_RESUME_TYPES.includes(file.type)) {
    return "File type not supported. Upload PDF, DOC, or DOCX.";
  }
  if (file.size > MAX_RESUME_BYTES) {
    return "File is too large. Maximum size is 5MB.";
  }
  return null;
}

/**
 * Resolve a stored value into a usable HTTPS URL for a public Supabase Storage bucket.
 * Accepts a full URL, a `/storage/v1/object/public/<bucket>/...` path, or a bare object path.
 */
export function resolveStorageUrl(
  value: string | null | undefined,
  bucket: string
): string | null {
  const raw = (value ?? "").trim();
  if (!raw) return null;

  const marker = `/storage/v1/object/public/${bucket}/`;
  const markerIdx = raw.indexOf(marker);

  let path: string;
  if (markerIdx !== -1) {
    // Re-derive from the object path so the host always matches the current project.
    path = raw.slice(markerIdx + marker.length);
  } else if (/^https?:\/\//i.test(raw)) {
    // Some other absolute URL (e.g. signed URL or external link) — use as-is.
    return raw;
  } else {
    path = raw.replace(/^\/+/, "");
    if (path.startsWith(`${bucket}/`)) path = path.slice(bucket.length + 1);
  }

  path = path.split("?")[0].replace(/^\/+/, "");
  if (!path) return null;

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data?.publicUrl ?? null;
}

/** Resolve a stored resume value into a viewable HTTPS URL. */
export function resolveResumeUrl(value: string | null | undefined): string | null {
  return resolveStorageUrl(value, "resumes");
}

/** Human-readable filename from a stored URL or object path. */
export function getStoredFileName(
  value: string | null | undefined,
  fallback = "resume"
): string {
  const raw = (value ?? "").split("?")[0];
  const last = raw.split("/").filter(Boolean).pop();
  if (!last) return fallback;
  try {
    return decodeURIComponent(last);
  } catch {
    return last;
  }
}

