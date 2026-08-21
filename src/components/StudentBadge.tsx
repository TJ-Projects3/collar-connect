import { GraduationCap } from "lucide-react";
import { cn } from "@/lib/utils";

interface StudentBadgeProps {
  /** `sm` for inline feed/comment usage, `lg` for prominent profile header usage. */
  size?: "sm" | "lg";
  /** Hide the school/class suffix (tight inline contexts). */
  compact?: boolean;
  /** School name shown after a separator dot. */
  school?: string | null;
  /** Graduation year, used when no school is available. */
  graduationYear?: number | null;
  className?: string;
}

/**
 * Identity pill for student accounts.
 * Shares geometry with RecruiterBadge / IndustryBadge.
 */
export const StudentBadge = ({
  size = "sm",
  compact,
  school,
  graduationYear,
  className,
}: StudentBadgeProps) => {
  const isProminent = size === "lg";
  const trimmedSchool = school?.trim();
  const suffix = compact
    ? null
    : trimmedSchool || (graduationYear ? `Class of ${graduationYear}` : null);

  return (
    <span
      className={cn(
        "inline-flex max-w-full items-center rounded-full font-semibold leading-none tracking-tight",
        "border border-secondary/40 bg-secondary/10 text-secondary",
        isProminent ? "gap-2 px-3.5 py-1.5 text-xs sm:text-sm" : "gap-1.5 px-2.5 py-1 text-[11px]",
        className
      )}
      title={suffix ? `Student · ${suffix}` : "Student"}
    >
      <GraduationCap
        className={cn("flex-shrink-0", isProminent ? "h-4 w-4" : "h-3.5 w-3.5")}
        aria-hidden="true"
      />
      <span className="whitespace-nowrap">Student</span>
      {suffix && (
        <>
          <span aria-hidden="true" className="opacity-50">
            ·
          </span>
          <span className="min-w-0 truncate font-medium opacity-90">{suffix}</span>
        </>
      )}
    </span>
  );
};
