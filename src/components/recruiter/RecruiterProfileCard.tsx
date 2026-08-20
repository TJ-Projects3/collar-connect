import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Briefcase, Globe, Linkedin, Mail, Pencil, Clock, XCircle } from "lucide-react";
import { RecruiterProfileModal } from "./RecruiterProfileModal";
import { recruiterStatus, isRecruiterApproved } from "@/lib/profile-display";

interface Props {
  profile: any;
  isOwnProfile: boolean;
  /** Admins may see the private work email. */
  isAdmin?: boolean;
}

export const RecruiterProfileCard = ({ profile, isOwnProfile, isAdmin }: Props) => {
  const [open, setOpen] = useState(false);

  const status = recruiterStatus(profile);
  const approved = isRecruiterApproved(profile);
  const roles: string[] = profile?.hiring_roles ?? [];
  const canSeeEmail = isOwnProfile || isAdmin === true;

  const isEmpty =
    !profile?.company_name && !profile?.company_website && !roles.length && !profile?.linkedin_url;

  if (!approved && !isOwnProfile && !isAdmin) return null;
  if (isEmpty && !isOwnProfile && !isAdmin) return null;

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <h2 className="flex items-center gap-2 text-xl font-bold">
            <Briefcase className="h-5 w-5 text-primary" />
            Recruiter details
          </h2>
          {isOwnProfile && (
            <Button variant="ghost" size="sm" className="gap-2" onClick={() => setOpen(true)}>
              <Pencil className="h-4 w-4" />
              {isEmpty ? "Complete" : "Edit"}
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {status === "pending" && (
            <div className="flex items-start gap-2 rounded-lg border border-dashed border-border bg-muted/40 p-3 text-sm text-muted-foreground">
              <Clock className="mt-0.5 h-4 w-4 flex-shrink-0" />
              <span>
                Pending review — the NextGen Collar team is verifying these company credentials.
                Your recruiter badge appears once you're approved.
              </span>
            </div>
          )}
          {status === "rejected" && (
            <div className="flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
              <XCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
              <span>
                This recruiter account wasn't approved. Update your company details and reach out to
                the NextGen Collar team for another review.
              </span>
            </div>
          )}

          {isEmpty ? (
            <p className="text-sm text-muted-foreground">
              Add your company name, work email, and the roles you're hiring for.
            </p>
          ) : (
            <>
              <div className="space-y-1">
                {profile?.company_name && (
                  <p className="font-semibold break-words">{profile.company_name}</p>
                )}
                {profile?.company_title && (
                  <p className="text-sm text-muted-foreground break-words">
                    {profile.company_title}
                  </p>
                )}
              </div>

              {canSeeEmail && profile?.company_email && (
                <p className="flex items-center gap-2 text-sm text-muted-foreground break-all">
                  <Mail className="h-4 w-4 flex-shrink-0" />
                  {profile.company_email}
                </p>
              )}

              {roles.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Actively hiring for
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {roles.map((role) => (
                      <Badge key={role} variant="secondary" className="break-words">
                        {role}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex flex-wrap gap-2 pt-1">
                {profile?.company_website && (
                  <Button variant="outline" size="sm" className="gap-2" asChild>
                    <a href={profile.company_website} target="_blank" rel="noopener noreferrer">
                      <Globe className="h-4 w-4" />
                      Company website
                    </a>
                  </Button>
                )}
                {profile?.linkedin_url && (
                  <Button variant="outline" size="sm" className="gap-2" asChild>
                    <a href={profile.linkedin_url} target="_blank" rel="noopener noreferrer">
                      <Linkedin className="h-4 w-4" />
                      LinkedIn
                    </a>
                  </Button>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {isOwnProfile && (
        <RecruiterProfileModal open={open} onOpenChange={setOpen} profile={profile} />
      )}
    </>
  );
};
