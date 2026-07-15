import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Github, Linkedin, Globe, FileText, ExternalLink, Code2, Pencil } from "lucide-react";
import { DeveloperPortfolioModal } from "./DeveloperPortfolioModal";

interface Props {
  profile: any;
  isOwnProfile: boolean;
}

export const DeveloperPortfolioCard = ({ profile, isOwnProfile }: Props) => {
  const [open, setOpen] = useState(false);

  const links = [
    { url: profile?.github_url, icon: Github, label: "GitHub" },
    { url: profile?.linkedin_url, icon: Linkedin, label: "LinkedIn" },
    { url: profile?.portfolio_url, icon: Globe, label: "Portfolio" },
  ].filter((l) => !!l.url);

  const projects = Array.isArray(profile?.featured_projects) ? profile.featured_projects : [];
  const hasResume = !!profile?.resume_url;
  const hasAnything = links.length > 0 || hasResume || projects.length > 0;

  if (!isOwnProfile && !hasAnything) return null;

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Code2 className="h-5 w-5 text-primary" />
            Developer Portfolio
          </h2>
          {isOwnProfile && (
            <Button variant="ghost" size="sm" onClick={() => setOpen(true)}>
              <Pencil className="h-4 w-4 mr-1" /> Edit
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-5">
          {!hasAnything && isOwnProfile && (
            <p className="text-sm text-muted-foreground text-center py-4">
              Add your links, resume, and projects to showcase your work.
            </p>
          )}

          {/* Links + Resume */}
          {(links.length > 0 || hasResume) && (
            <div className="flex flex-wrap gap-2">
              {links.map(({ url, icon: Icon, label }) => (
                <Button key={label} variant="outline" size="sm" asChild className="gap-2">
                  <a href={url} target="_blank" rel="noopener noreferrer">
                    <Icon className="h-4 w-4" /> {label}
                  </a>
                </Button>
              ))}
              {hasResume && (
                <Button size="sm" asChild className="gap-2">
                  <a href={profile.resume_url} target="_blank" rel="noopener noreferrer">
                    <FileText className="h-4 w-4" /> View Resume
                  </a>
                </Button>
              )}
            </div>
          )}

          {/* Projects */}
          {projects.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {projects.map((p: any) => (
                <div key={p.id} className="border rounded-lg p-4 hover:border-primary/50 transition-colors">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold">{p.title}</h3>
                    <div className="flex gap-1">
                      {p.repo_url && (
                        <a href={p.repo_url} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary" aria-label="Repository">
                          <Github className="h-4 w-4" />
                        </a>
                      )}
                      {p.live_url && (
                        <a href={p.live_url} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary" aria-label="Live demo">
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      )}
                    </div>
                  </div>
                  {p.description && (
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-3">{p.description}</p>
                  )}
                  {Array.isArray(p.tech_stack) && p.tech_stack.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-3">
                      {p.tech_stack.map((t: string) => (
                        <Badge key={t} variant="secondary" className="text-xs">{t}</Badge>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {isOwnProfile && (
        <DeveloperPortfolioModal open={open} onOpenChange={setOpen} profile={profile} />
      )}
    </>
  );
};
