import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, Github, Code2 } from "lucide-react";
import { AchievementBadge } from "./ProjectCard";

export interface FeedProject {
  id: string;
  title: string;
  description?: string | null;
  cover_image_url?: string | null;
  tech_stack?: string[] | null;
  repo_url?: string | null;
  live_url?: string | null;
  achievement_label?: string | null;
  achievement_verified?: boolean | null;
}

export const FeedProjectEmbed = ({ project }: { project: FeedProject }) => {
  const tech = project.tech_stack || [];

  return (
    <div className="mt-3 rounded-lg border overflow-hidden bg-card">
      {project.cover_image_url && (
        <img
          src={project.cover_image_url}
          alt={`${project.title} cover image`}
          loading="lazy"
          className="w-full aspect-video object-cover"
        />
      )}
      <div className="p-3 space-y-2">
        <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-wide font-semibold">
          <Code2 className="h-3.5 w-3.5" /> Project
        </div>
        <div className="space-y-1.5">
          <h4 className="font-semibold leading-snug break-words">{project.title}</h4>
          {project.achievement_label && (
            <AchievementBadge
              label={project.achievement_label}
              verified={!!project.achievement_verified}
            />
          )}
        </div>
        {tech.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {tech.map((t) => (
              <Badge key={t} variant="secondary" className="text-xs">
                {t}
              </Badge>
            ))}
          </div>
        )}
        {(project.repo_url || project.live_url) && (
          <div className="flex flex-wrap gap-2 pt-1">
            {project.repo_url && (
              <Button variant="outline" size="sm" asChild className="gap-1.5">
                <a href={project.repo_url} target="_blank" rel="noopener noreferrer">
                  <Github className="h-4 w-4" /> GitHub
                </a>
              </Button>
            )}
            {project.live_url && (
              <Button size="sm" asChild className="gap-1.5">
                <a href={project.live_url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4" /> Live Demo
                </a>
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
