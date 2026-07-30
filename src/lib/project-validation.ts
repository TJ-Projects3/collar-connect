import { z } from "zod";

const urlOrEmpty = z
  .string()
  .trim()
  .max(500, "URL too long")
  .refine((v) => v === "" || /^https?:\/\/.+\..+/i.test(v), {
    message: "Please enter a valid URL (must start with http:// or https://)",
  });

export const studentProjectSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(100, "Max 100 characters"),
  description: z.string().trim().max(500, "Max 500 characters").optional().or(z.literal("")),
  tech_stack: z.array(z.string().trim().min(1).max(30)).max(15, "Max 15 technologies"),
  repo_url: urlOrEmpty.optional().or(z.literal("")),
  live_url: urlOrEmpty.optional().or(z.literal("")),
  achievement_label: z.string().trim().max(60, "Max 60 characters").optional().or(z.literal("")),
  share_to_feed: z.boolean().default(false),
});

export type StudentProjectFormData = z.infer<typeof studentProjectSchema>;

export function normalizeProjectUrl(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

export const ALLOWED_COVER_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
export const ALLOWED_COVER_EXTS = ["jpg", "jpeg", "png", "webp", "gif"];
export const MAX_COVER_BYTES = 5 * 1024 * 1024;

export function validateCoverImage(file: File): string | null {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (!ALLOWED_COVER_EXTS.includes(ext)) {
    return "Only JPG, PNG, WEBP, or GIF images are allowed.";
  }
  if (file.type && !ALLOWED_COVER_TYPES.includes(file.type)) {
    return "File type not supported. Upload a JPG, PNG, WEBP, or GIF.";
  }
  if (file.size > MAX_COVER_BYTES) {
    return "Image is too large. Maximum size is 5MB.";
  }
  return null;
}
