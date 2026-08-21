import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GraduationCap, Pencil, Target, Wrench, ShieldCheck } from "lucide-react";
import { pillClass } from "@/lib/profile-display";

interface Props {
  profile: any;
  isOwnProfile: boolean;
  onEdit?: () => void;
}

/** Student skills, target tracks, and work status. Academics live in the header pills. */
export const StudentProfileCard = ({ profile, isOwnProfile, onEdit }: Props) => {
  const skills: string[] = profile?.technical_skills ?? [];
  const tracks: string[] = profile?.target_tracks ?? [];
  const workStatus: string[] = profile?.work_status ?? [];
  const workAuth: string | null = profile?.work_authorization ?? null;

  const isEmpty = !skills.length && !tracks.length && !workStatus.length && !workAuth;

  if (isEmpty && !isOwnProfile) return null;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <h2 className="flex items-center gap-2 text-xl font-bold">
          <GraduationCap className="h-5 w-5 text-secondary" />
          Student profile
        </h2>

        {isOwnProfile && onEdit && (
          <Button variant="ghost" size="sm" className="gap-2" onClick={onEdit}>
            <Pencil className="h-4 w-4" />
            {isEmpty ? "Complete" : "Edit"}
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {isEmpty ? (
          <p className="text-sm text-muted-foreground">
            Add your school, skills, and target career track so recruiters and mentors can find you.
          </p>
        ) : (
          <>
            {(academics.length > 0 || graduation) && (
              <div className="space-y-1">
                {academics.length > 0 && (
                  <p className="font-medium break-words">{academics.join(" · ")}</p>
                )}
                {graduation && (
                  <p className="text-sm text-muted-foreground">Expected graduation {graduation}</p>
                )}
              </div>
            )}

            {skills.length > 0 && (
              <div className="space-y-2">
                <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  <Wrench className="h-3.5 w-3.5" /> Skills & tools
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {skills.map((s) => (
                    <Badge key={s} variant="secondary" className="break-words">{s}</Badge>
                  ))}
                </div>
              </div>
            )}

            {tracks.length > 0 && (
              <div className="space-y-2">
                <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  <Target className="h-3.5 w-3.5" /> Target tracks
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {tracks.map((t) => (
                    <Badge key={t} variant="outline" className="break-words">{t}</Badge>
                  ))}
                </div>
              </div>
            )}

            {(workStatus.length > 0 || workAuth) && (
              <div className="space-y-2">
                <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  <ShieldCheck className="h-3.5 w-3.5" /> Work status
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {workStatus.map((w) => (
                    <Badge key={w} className="break-words">{w}</Badge>
                  ))}
                  {workAuth && (
                    <Badge variant="outline" className="break-words">{workAuth}</Badge>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};
