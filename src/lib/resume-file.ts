import { supabase } from "@/integrations/supabase/client";

const BUCKET = "resumes";

/**
 * Extracts the object path inside the `resumes` bucket from either a full
 * public URL or an already-bare storage path.
 */
export function getResumeStoragePath(value: string | null | undefined): string | null {
  const raw = (value ?? "").trim();
  if (!raw) return null;

  const marker = `/storage/v1/object/public/${BUCKET}/`;
  const idx = raw.indexOf(marker);

  let path: string;
  if (idx !== -1) {
    path = raw.slice(idx + marker.length);
  } else if (/^https?:\/\//i.test(raw)) {
    // External URL that isn't Supabase storage — no storage path available.
    return null;
  } else {
    path = raw.replace(/^\/+/, "");
    if (path.startsWith(`${BUCKET}/`)) path = path.slice(BUCKET.length + 1);
  }

  path = path.split("?")[0].replace(/^\/+/, "");
  return path ? decodeURIComponent(path) : null;
}

/**
 * Downloads the resume as a Blob through the Supabase client and returns a
 * local object URL. Blob URLs are same-origin, so ad blockers and privacy
 * extensions that block third-party *.supabase.co requests in the address bar
 * can't interfere with opening/downloading the file.
 */
export async function fetchResumeBlobUrl(
  value: string | null | undefined
): Promise<{ blobUrl: string; fileName: string }> {
  const path = getResumeStoragePath(value);
  if (!path) throw new Error("This resume link is not a stored file.");

  const { data, error } = await supabase.storage.from(BUCKET).download(path);
  if (error || !data) throw error ?? new Error("Could not download the resume.");

  const fileName = path.split("/").filter(Boolean).pop() || "resume.pdf";
  const blob = data.type ? data : new Blob([data], { type: "application/pdf" });
  return { blobUrl: URL.createObjectURL(blob), fileName };
}

/** Revokes a blob URL after the browser has had time to consume it. */
function scheduleRevoke(blobUrl: string) {
  window.setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
}

export async function openResumeInNewTab(value: string | null | undefined) {
  const { blobUrl } = await fetchResumeBlobUrl(value);
  const win = window.open(blobUrl, "_blank", "noopener,noreferrer");
  if (!win) {
    // Popup blocked — fall back to a same-tab navigation attempt.
    const a = document.createElement("a");
    a.href = blobUrl;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    document.body.appendChild(a);
    a.click();
    a.remove();
  }
  scheduleRevoke(blobUrl);
}

export async function downloadResume(value: string | null | undefined) {
  const { blobUrl, fileName } = await fetchResumeBlobUrl(value);
  const a = document.createElement("a");
  a.href = blobUrl;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  scheduleRevoke(blobUrl);
}

/** Human-friendly message for failures, including extension/network blocks. */
export function resumeErrorMessage(e: unknown): string {
  const msg = (e as { message?: string })?.message ?? "";
  if (!msg || /failed to fetch|load failed|network|blocked/i.test(msg)) {
    return "The request was blocked — this is usually an ad blocker or privacy extension. Please pause it for this site and try again.";
  }
  return msg;
}
