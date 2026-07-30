import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { BadgeCheck, Award, ExternalLink, Github } from "lucide-react";
import { useProjectAchievements, useSetProjectVerification } from "@/hooks/useStudentProjects";

export const ProjectAchievementsTab = () => {
  const { data: projects, isLoading } = useProjectAchievements();
  const setVerification = useSetProjectVerification();

  const initials = (name?: string | null) =>
    (name || "U")
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Award className="h-5 w-5 text-primary" />
          Project Achievements
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <p className="text-muted-foreground text-center py-6">Loading...</p>
        ) : !projects || projects.length === 0 ? (
          <p className="text-muted-foreground text-center py-6">
            No achievement claims submitted yet.
          </p>
        ) : (
          projects.map((p: any) => (
            <div
              key={p.id}
              className="flex flex-col sm:flex-row sm:items-center gap-3 border rounded-lg p-4"
            >
              <Avatar className="h-10 w-10">
                <AvatarImage src={p.profile?.avatar_url || undefined} />
                <AvatarFallback>{initials(p.profile?.full_name)}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold break-words">{p.title}</span>
                  <Badge variant={p.achievement_verified ? "default" : "secondary"} className="gap-1">
                    {p.achievement_verified && <BadgeCheck className="h-3 w-3" />}
                    {p.achievement_label}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground break-words">
                  {p.profile?.full_name || "Unknown student"}
                </p>
                <div className="flex gap-3 text-sm">
                  {p.repo_url && (
                    <a
                      href={p.repo_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-primary hover:underline"
                    >
                      <Github className="h-3.5 w-3.5" /> Repo
                    </a>
                  )}
                  {p.live_url && (
                    <a
                      href={p.live_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-primary hover:underline"
                    >
                      <ExternalLink className="h-3.5 w-3.5" /> Live
                    </a>
                  )}
                </div>
              </div>
              <Button
                variant={p.achievement_verified ? "outline" : "default"}
                size="sm"
                disabled={setVerification.isPending}
                onClick={() =>
                  setVerification.mutate({ id: p.id, verified: !p.achievement_verified })
                }
              >
                {p.achievement_verified ? "Remove verification" : "Verify"}
              </Button>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
};
