// Shared option lists for role-specific profile fields.
import { TRACK_META } from "@/lib/career-scoring";

/** Career Mapping tracks, plus common target roles students aim for. */
export const CAREER_TRACK_LABELS: Record<string, string> = {
  Cloud: "Cloud Architecture",
  Security: "Cybersecurity",
  Data: "Data / AI",
  "Systems/DevOps": "Systems Engineering / DevOps",
};

export const TARGET_TRACK_OPTIONS: string[] = [
  ...Object.keys(TRACK_META).map((t) => CAREER_TRACK_LABELS[t] ?? t),
  "Full Stack Engineering",
  "Software Engineering",
  "Product Management",
  "IT Support / Networking",
];

export const TECHNICAL_SKILL_SUGGESTIONS = [
  "Java", "Python", "JavaScript", "TypeScript", "React", "Node.js",
  "SQL", "Docker", "Kubernetes", "AWS", "Azure", "Git",
  "Linux", "C++", "Go", "Figma",
];

export const WORK_STATUS_OPTIONS = [
  "Seeking Internships",
  "Seeking Co-op",
  "Seeking Full-Time",
  "Open to Freelance",
  "Not Looking",
];

export const WORK_AUTHORIZATION_OPTIONS = [
  "US Citizen",
  "Permanent Resident",
  "Visa Holder",
  "Needs Sponsorship",
];

export const MENTORSHIP_OFFERING_OPTIONS = [
  "Code Reviews",
  "Resume Roasting",
  "Mock Interviews",
  "System Design",
  "Career Transitions",
  "Portfolio Feedback",
  "Referrals",
];

export const SENIORITY_OPTIONS = [
  "Mid-Level",
  "Senior",
  "Staff / Lead",
  "Principal",
  "Executive",
];

export const HIRING_FOCUS_SUGGESTIONS = [
  "Software Engineering",
  "Cybersecurity",
  "Data / AI",
  "Internships",
  "New Grad Roles",
  "Cloud / DevOps",
  "IT Support",
  "Product Management",
];

export const WORK_TYPE_OPTIONS = ["Remote", "Hybrid", "On-Site"];

export const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/** "May 2027" from a 1-12 month plus a year. */
export const formatGraduation = (
  month?: number | null,
  year?: number | null
): string | null => {
  if (!year) return null;
  if (month && month >= 1 && month <= 12) return `${MONTHS[month - 1]} ${year}`;
  return String(year);
};

/** Pull the domain out of a work email, e.g. "you@acme.com" -> "acme.com". */
export const domainFromEmail = (email?: string | null): string | null => {
  const at = email?.trim().split("@")[1]?.trim().toLowerCase();
  return at || null;
};
