import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BadgeCheck, GraduationCap, Handshake, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { availabilityLabel, type Candidate } from "@/hooks/useTalentCandidates";
import { EndorsementPill } from "@/components/endorsements/EndorsementBadges";
import { useRecordTalentAccess } from "@/hooks/useTalentAccess";
import type { TalentAccessLevel } from "@/lib/profile-display";

const getInitials = (name?: string | null) =>
  (name || "?")
    .split(" ")
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

export const CandidateCard = ({
  candidate,
  accessLevel = "full",
}: {
  candidate: Candidate;
  accessLevel?: TalentAccessLevel;
}) => {
  const navigate = useNavigate();
  const recordAccess = useRecordTalentAccess();
  const scoped = accessLevel === "scoped";
  const topSkills = candidate.skills.slice(0, 5);
  const extraSkills = candidate.skills.length - topSkills.length;
  const availability = availabilityLabel(candidate.availability);
  const project = candidate.topProject;

  // Industry accounts are metered server-side; recruiters go straight through.
  const handleContact = async () => {
    if (!scoped) {
      navigate(`/messages?recipientId=${candidate.id}`);
      return;
    }
    try {
      const result = await recordAccess.mutateAsync({ targetId: candidate.id, kind: "contact" });
      if (!result?.allowed) {
        toast.error("Daily intro request limit reached. Try again tomorrow.");
        return;
      }
      navigate(`/messages?recipientId=${candidate.id}`);
    } catch (e: any) {
      toast.error(e?.message || "Could not send intro request");
    }
  };

  const handleViewProfile = async () => {
    if (!scoped) {
      navigate(`/profile?userId=${candidate.id}`);
      return;
    }
    try {
      const result = await recordAccess.mutateAsync({ targetId: candidate.id, kind: "view" });
      if (!result?.allowed) {
        toast.error("Daily profile view limit reached. Try again tomorrow.");
        return;
      }
      navigate(`/profile?userId=${candidate.id}`);
    } catch (e: any) {
      toast.error(e?.message || "Could not open profile");
    }
  };

  const meta = [
    candidate.university,
    candidate.major,
    candidate.graduation_year ? `Class of ${candidate.graduation_year}` : null,
  ].filter(Boolean);

  return (
    <Card className="h-full overflow-hidden transition-shadow hover:shadow-md">
      <CardContent className="p-5 flex flex-col h-full gap-4">
        <div className="flex items-start gap-3">
          <Link to={`/profile?userId=${candidate.id}`} className="flex-shrink-0">
            <Avatar className="h-12 w-12">
              <AvatarImage src={candidate.avatar_url || undefined} alt={candidate.full_name || "Candidate"} />
              <AvatarFallback className="bg-primary text-primary-foreground">
                {getInitials(candidate.full_name)}
              </AvatarFallback>
            </Avatar>
          </Link>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <Link
                to={`/profile?userId=${candidate.id}`}
                className="font-semibold hover:underline break-words"
              >
                {candidate.full_name || "Unnamed student"}
              </Link>
              {candidate.isVerifiedIntern && (
                <Badge className="gap-1 border-transparent bg-[hsl(43_96%_50%)] text-[hsl(30_60%_15%)] hover:bg-[hsl(43_96%_45%)]">
                  <BadgeCheck className="h-3 w-3" />
                  NextGen Verified Intern
                </Badge>
              )}
            </div>
            {meta.length > 0 && (
              <p className="text-sm text-muted-foreground mt-1 break-words">
                {meta.join(" · ")}
              </p>
            )}
            {candidate.endorsements.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {candidate.endorsements.slice(0, 2).map((e) => (
                  <EndorsementPill key={e.id} title={e.badge_title} />
                ))}
              </div>
            )}
            {availability && (
              <Badge variant="secondary" className="mt-2 gap-1">
                <GraduationCap className="h-3 w-3" />
                {availability}
              </Badge>
            )}
          </div>
        </div>

        {topSkills.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {topSkills.map((skill) => (
              <Badge key={skill} variant="outline" className="text-xs">
                {skill}
              </Badge>
            ))}
            {extraSkills > 0 && (
              <Badge variant="outline" className="text-xs text-muted-foreground">
                +{extraSkills} more
              </Badge>
            )}
          </div>
        )}

        {project ? (
          <Link
            to={`/profile?userId=${candidate.id}`}
            className="flex items-center gap-3 rounded-lg border bg-muted/40 p-3 hover:bg-muted transition-colors"
          >
            {project.cover_image_url ? (
              <img
                src={project.cover_image_url}
                alt={`${project.title} project preview`}
                loading="lazy"
                className="h-14 w-20 flex-shrink-0 rounded-md object-cover"
              />
            ) : (
              <div className="h-14 w-20 flex-shrink-0 rounded-md bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-primary-foreground text-sm font-semibold">
                {getInitials(project.title)}
              </div>
            )}
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Top project</p>
              <p className="text-sm font-medium truncate">{project.title}</p>
              {candidate.projectCount > 1 && (
                <p className="text-xs text-muted-foreground">
                  +{candidate.projectCount - 1} more project{candidate.projectCount > 2 ? "s" : ""}
                </p>
              )}
            </div>
          </Link>
        ) : (
          <div className="rounded-lg border border-dashed p-3 text-sm text-muted-foreground">
            No projects published yet
          </div>
        )}

        <div className="mt-auto flex flex-col sm:flex-row gap-2">
          <Button
            className="flex-1 gap-2"
            onClick={() => navigate(`/messages?recipientId=${candidate.id}`)}
          >
            <MessageSquare className="h-4 w-4" />
            Message Candidate
          </Button>
          <Button variant="outline" className="flex-1" asChild>
            <Link to={`/profile?userId=${candidate.id}`}>View profile</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
