import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Github, Linkedin, Globe, Code2, Pencil } from "lucide-react";
import { DeveloperPortfolioModal } from "./DeveloperPortfolioModal";

interface Props {
  profile: any;
  isOwnProfile: boolean;
}

/**
 * Professional links (GitHub / LinkedIn / Portfolio).
 * Resume actions live in the profile header action row via <ResumeActions />.
 */
export const DeveloperPortfolioCard = ({ profile, isOwnProfile }: Props) => {
  const [open, setOpen] = useState(false);

  const links = [
    { url: profile?.github_url, icon: Github, label: "GitHub" },
    { url: profile?.linkedin_url, icon: Linkedin, label: "LinkedIn" },
    { url: profile?.portfolio_url, icon: Globe, label: "Portfolio" },
  ].filter((l) => !!l.url);

  if (!isOwnProfile && links.length === 0) return null;

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <h2 className="flex items-center gap-2 text-xl font-bold">
            <Code2 className="h-5 w-5 text-primary" />
            Developer links
          </h2>
          {isOwnProfile && (
            <Button variant="ghost" size="sm" className="gap-2" onClick={() => setOpen(true)}>
              <Pencil className="h-4 w-4" />
              {links.length === 0 ? "Add" : "Edit"}
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {links.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Add your GitHub, LinkedIn, portfolio, and resume so recruiters can see your work.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {links.map(({ url, icon: Icon, label }) => (
                <Button key={label} variant="outline" size="sm" asChild className="gap-2">
                  <a href={url} target="_blank" rel="noopener noreferrer">
                    <Icon className="h-4 w-4" /> {label}
                  </a>
                </Button>
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
