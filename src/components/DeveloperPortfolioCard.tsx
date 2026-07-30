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

  const hasResume = !!profile?.resume_url;
  const hasAnything = links.length > 0 || hasResume;

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

        </CardContent>
      </Card>

      {isOwnProfile && (
        <DeveloperPortfolioModal open={open} onOpenChange={setOpen} profile={profile} />
      )}
    </>
  );
};
