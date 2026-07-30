import { BadgeCheck, Briefcase } from "lucide-react";
import { cn } from "@/lib/utils";

interface RecruiterBadgeProps {
  verified?: boolean;
  className?: string;
  compact?: boolean;
  /** Optional company name rendered inside the pill after a separator dot. */
  company?: string | null;
  /** `sm` for inline feed/comment usage, `lg` for prominent profile header usage. */
  size?: "sm" | "lg";
}

/** Sleek identity pill for recruiter accounts. Shares geometry with EndorsementPill. */
export const RecruiterBadge = ({
  verified,
  className,
  compact,
  company,
  size = "sm",
}: RecruiterBadgeProps) => {
  const Icon = verified ? BadgeCheck : Briefcase;
  const label = verified ? (compact ? "Verified" : "Verified Recruiter") : "Recruiter";
  const trimmedCompany = company?.trim();

  return (
    <span
      className={cn(
        "inline-flex max-w-full items-center rounded-full font-semibold leading-none tracking-tight",
        size === "lg"
          ? "gap-2 px-3.5 py-1.5 text-xs sm:text-sm"
          : "gap-1.5 px-2.5 py-1 text-[11px]",
        verified
          ? size === "lg"
            ? "bg-primary text-primary-foreground shadow-[var(--shadow-elegant)]"
            : "bg-primary text-primary-foreground shadow-sm"
          : "bg-muted text-muted-foreground border border-border",
        className
      )}
      title={
        trimmedCompany
          ? `${verified ? "Verified recruiter" : "Recruiter account"} · ${trimmedCompany}`
          : verified
            ? "Verified recruiter"
            : "Recruiter account"
      }
    >
      <Icon
        className={cn("flex-shrink-0", size === "lg" ? "h-4 w-4" : "h-3.5 w-3.5")}
        aria-hidden="true"
      />
      <span className="whitespace-nowrap">{label}</span>
      {trimmedCompany && (
        <>
          <span aria-hidden="true" className="opacity-50">
            ·
          </span>
          <span className="min-w-0 truncate font-medium opacity-90">{trimmedCompany}</span>
        </>
      )}
    </span>
  );
};
