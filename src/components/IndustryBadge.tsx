import { BadgeCheck, Building2, Factory } from "lucide-react";
import { cn } from "@/lib/utils";

interface IndustryBadgeProps {
  verified?: boolean;
  /** Render as a company account instead of an individual professional. */
  company?: boolean;
  /** Company / employer name rendered after a separator dot. */
  companyName?: string | null;
  /** Optional logo shown inline for company accounts. */
  logoUrl?: string | null;
  size?: "sm" | "lg";
  className?: string;
}

/**
 * Identity pill for industry accounts (professionals and companies).
 * Mirrors RecruiterBadge geometry but uses the secondary cyan instead of primary navy.
 */
export const IndustryBadge = ({
  verified,
  company,
  companyName,
  logoUrl,
  size = "sm",
  className,
}: IndustryBadgeProps) => {
  const isProminent = size === "lg";
  const label = company ? "Company" : "Industry Professional";
  const trimmed = companyName?.trim();
  const Icon = verified ? BadgeCheck : company ? Building2 : Factory;

  return (
    <span
      className={cn(
        "inline-flex max-w-full items-center rounded-full font-semibold leading-none tracking-tight",
        isProminent ? "gap-2 px-3.5 py-1.5 text-xs sm:text-sm" : "gap-1.5 px-2.5 py-1 text-[11px]",
        verified
          ? isProminent
            ? "bg-secondary text-secondary-foreground shadow-[var(--shadow-elegant)]"
            : "bg-secondary text-secondary-foreground shadow-sm"
          : "bg-muted text-muted-foreground border border-border",
        className
      )}
      title={
        trimmed
          ? `${verified ? "Verified" : "Unverified"} ${label.toLowerCase()} · ${trimmed}`
          : `${verified ? "Verified" : "Unverified"} ${label.toLowerCase()}`
      }
    >
      {company && logoUrl ? (
        <img
          src={logoUrl}
          alt=""
          aria-hidden="true"
          className={cn(
            "flex-shrink-0 rounded-full object-cover",
            isProminent ? "h-4 w-4" : "h-3.5 w-3.5"
          )}
        />
      ) : (
        <Icon
          className={cn("flex-shrink-0", isProminent ? "h-4 w-4" : "h-3.5 w-3.5")}
          aria-hidden="true"
        />
      )}
      <span className="whitespace-nowrap">{label}</span>
      {trimmed && (
        <>
          <span aria-hidden="true" className="opacity-50">
            ·
          </span>
          <span className="min-w-0 truncate font-medium opacity-90">{trimmed}</span>
        </>
      )}
    </span>
  );
};
