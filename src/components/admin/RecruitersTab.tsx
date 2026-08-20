import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Check, X, ExternalLink, Mail, Linkedin, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  useRecruiterDecision,
  useRecruiterReviewList,
  type RecruiterReviewRow,
} from "@/hooks/useRecruiterReview";

const initials = (name?: string | null) =>
  (name ?? "?")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

const withProtocol = (url?: string | null) =>
  !url ? null : /^https?:\/\//i.test(url) ? url : `https://${url}`;

const RecruiterCard = ({
  recruiter,
  onDecide,
  pendingId,
}: {
  recruiter: RecruiterReviewRow;
  onDecide: (r: RecruiterReviewRow, status: "approved" | "rejected") => void;
  pendingId: string | null;
}) => {
  const website = withProtocol(recruiter.company_website);
  const linkedin = withProtocol(recruiter.linkedin_url);
  const busy = pendingId === recruiter.id;
  const isPending = recruiter.recruiter_status === "pending";

  return (
    <Card>
      <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-start">
        <Avatar className="h-12 w-12 shrink-0">
          <AvatarImage src={recruiter.avatar_url ?? undefined} />
          <AvatarFallback>{initials(recruiter.full_name)}</AvatarFallback>
        </Avatar>

        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold">{recruiter.full_name ?? "Unnamed recruiter"}</p>
            <Badge
              variant={
                recruiter.recruiter_status === "approved"
                  ? "default"
                  : recruiter.recruiter_status === "rejected"
                    ? "destructive"
                    : "secondary"
              }
            >
              {recruiter.recruiter_status}
            </Badge>
          </div>

          <p className="text-sm text-muted-foreground [overflow-wrap:anywhere]">
            {[recruiter.company_title, recruiter.company_name].filter(Boolean).join(" @ ") ||
              "No company details submitted"}
          </p>

          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
            {recruiter.company_email && (
              <a
                href={`mailto:${recruiter.company_email}`}
                className="inline-flex items-center gap-1 text-primary hover:underline [overflow-wrap:anywhere]"
              >
                <Mail className="h-3.5 w-3.5" />
                {recruiter.company_email}
              </a>
            )}
            {website && (
              <a
                href={website}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-primary hover:underline [overflow-wrap:anywhere]"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Website
              </a>
            )}
            {linkedin && (
              <a
                href={linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-primary hover:underline"
              >
                <Linkedin className="h-3.5 w-3.5" />
                LinkedIn
              </a>
            )}
          </div>

          {recruiter.hiring_roles?.length ? (
            <div className="flex flex-wrap gap-1.5">
              {recruiter.hiring_roles.map((role) => (
                <Badge key={role} variant="outline" className="font-normal">
                  {role}
                </Badge>
              ))}
            </div>
          ) : null}

          <p className="text-xs text-muted-foreground">
            Signed up {new Date(recruiter.created_at).toLocaleDateString()}
          </p>
        </div>

        <div className="flex shrink-0 gap-2">
          {isPending ? (
            <>
              <Button size="sm" disabled={busy} onClick={() => onDecide(recruiter, "approved")}>
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                <span className="ml-1">Approve</span>
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={busy}
                onClick={() => onDecide(recruiter, "rejected")}
              >
                <X className="h-4 w-4" />
                <span className="ml-1">Reject</span>
              </Button>
            </>
          ) : (
            <Button
              size="sm"
              variant="outline"
              disabled={busy}
              onClick={() =>
                onDecide(
                  recruiter,
                  recruiter.recruiter_status === "approved" ? "rejected" : "approved",
                )
              }
            >
              {busy ? (
                <Loader2 className="mr-1 h-4 w-4 animate-spin" />
              ) : null}
              {recruiter.recruiter_status === "approved" ? "Revoke access" : "Approve"}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export const RecruitersTab = () => {
  const { data: recruiters, isLoading } = useRecruiterReviewList();
  const decision = useRecruiterDecision();
  const { toast } = useToast();
  const [pendingId, setPendingId] = useState<string | null>(null);

  const handleDecide = (recruiter: RecruiterReviewRow, status: "approved" | "rejected") => {
    const confirmed = window.confirm(
      status === "approved"
        ? `Approve ${recruiter.full_name ?? "this recruiter"}? They'll get an approval email and full recruiter access.`
        : `Reject ${recruiter.full_name ?? "this recruiter"}? They'll get an email and stay locked out of recruiter features.`,
    );
    if (!confirmed) return;

    setPendingId(recruiter.id);
    decision.mutate(
      { recruiterId: recruiter.id, status },
      {
        onSuccess: (result) => {
          toast({
            title: status === "approved" ? "Recruiter approved" : "Recruiter rejected",
            description: result.emailSent
              ? "Status updated and the recruiter has been emailed."
              : `Status updated, but the email didn't send${result.emailError ? `: ${result.emailError}` : "."}`,
            variant: result.emailSent ? "default" : "destructive",
          });
        },
        onError: (error) => {
          toast({
            title: "Couldn't update recruiter",
            description: error instanceof Error ? error.message : "Unknown error",
            variant: "destructive",
          });
        },
        onSettled: () => setPendingId(null),
      },
    );
  };

  const byStatus = (status: string) =>
    (recruiters ?? []).filter((r) => r.recruiter_status === status);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const groups: Array<{ value: string; label: string; rows: RecruiterReviewRow[]; empty: string }> = [
    {
      value: "pending",
      label: `Pending (${byStatus("pending").length})`,
      rows: byStatus("pending"),
      empty: "No recruiters are waiting for review.",
    },
    {
      value: "approved",
      label: `Approved (${byStatus("approved").length})`,
      rows: byStatus("approved"),
      empty: "No approved recruiters yet.",
    },
    {
      value: "rejected",
      label: `Rejected (${byStatus("rejected").length})`,
      rows: byStatus("rejected"),
      empty: "No rejected recruiters.",
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary" />
          Recruiter verification
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Review company credentials before unlocking candidate search, messaging, and posting.
          Approving or rejecting emails the recruiter automatically.
        </p>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="pending" className="space-y-4">
          <TabsList>
            {groups.map((g) => (
              <TabsTrigger key={g.value} value={g.value}>
                {g.label}
              </TabsTrigger>
            ))}
          </TabsList>
          {groups.map((g) => (
            <TabsContent key={g.value} value={g.value} className="space-y-3">
              {g.rows.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">{g.empty}</p>
              ) : (
                g.rows.map((r) => (
                  <RecruiterCard
                    key={r.id}
                    recruiter={r}
                    onDecide={handleDecide}
                    pendingId={pendingId}
                  />
                ))
              )}
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
};
