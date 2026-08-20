import { Card, CardContent } from "@/components/ui/card";
import { ShieldAlert, Clock } from "lucide-react";
import type { RecruiterStatus } from "@/lib/profile-display";

interface RecruiterStatusNoticeProps {
  status: RecruiterStatus | null;
  /** What the recruiter just tried to do, e.g. "post to the feed". */
  action?: string;
  className?: string;
}

export const RecruiterStatusNotice = ({
  status,
  action = "use this feature",
  className,
}: RecruiterStatusNoticeProps) => {
  const rejected = status === "rejected";

  return (
    <Card className={className}>
      <CardContent className="flex items-start gap-3 p-4">
        {rejected ? (
          <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
        ) : (
          <Clock className="mt-0.5 h-5 w-5 shrink-0 text-secondary" />
        )}
        <div className="space-y-1">
          <p className="font-medium">
            {rejected ? "Recruiter account not approved" : "Recruiter account pending review"}
          </p>
          <p className="text-sm text-muted-foreground">
            {rejected
              ? `Your recruiter account wasn't approved, so you can't ${action}. Reach out to the NextGen Collar team if you think this is a mistake.`
              : `The NextGen Collar team is reviewing your recruiter account. You'll be able to ${action} — along with candidate search and direct messaging — as soon as you're approved.`}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
