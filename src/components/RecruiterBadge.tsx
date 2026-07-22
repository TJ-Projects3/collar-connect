import { BadgeCheck } from "lucide-react";
import { cn } from "@/lib/utils";

interface RecruiterBadgeProps {
  verified?: boolean;
  className?: string;
  compact?: boolean;
}

export const RecruiterBadge = ({ verified, className, compact }: RecruiterBadgeProps) => {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full bg-secondary/15 text-secondary-foreground border border-secondary/30 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
        className
      )}
      title={verified ? "Verified hiring recruiter" : "Hiring recruiter"}
    >
      <BadgeCheck className={cn("h-3 w-3", verified ? "text-secondary" : "text-muted-foreground")} />
      {compact ? "Recruiter" : "Hiring Recruiter"}
    </span>
  );
};
