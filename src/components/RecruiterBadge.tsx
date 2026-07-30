import { BadgeCheck, Briefcase } from "lucide-react";
import { cn } from "@/lib/utils";

interface RecruiterBadgeProps {
  verified?: boolean;
  className?: string;
  compact?: boolean;
}

/** Sleek identity pill for recruiter accounts. Shares geometry with EndorsementPill. */
export const RecruiterBadge = ({ verified, className, compact }: RecruiterBadgeProps) => {
  const Icon = verified ? BadgeCheck : Briefcase;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold leading-none tracking-tight",
        verified
          ? "bg-primary text-primary-foreground shadow-sm"
          : "bg-muted text-muted-foreground border border-border",
        className
      )}
      title={verified ? "Verified recruiter" : "Recruiter account"}
    >
      <Icon className="h-3.5 w-3.5 flex-shrink-0" />
      {verified ? (compact ? "Verified" : "Verified Recruiter") : "Recruiter"}
    </span>
  );
};
