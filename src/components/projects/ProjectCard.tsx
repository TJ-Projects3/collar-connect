import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BadgeCheck, Clock, ExternalLink, Github, Pencil, Share2, Trash2, Code2 } from "lucide-react";
import type { StudentProject } from "@/hooks/useStudentProjects";

interface ProjectCardProps {
  project: StudentProject;
  isOwner?: boolean;
  onEdit?: (project: StudentProject) => void;
  onDelete?: (project: StudentProject) => void;
  onShare?: (project: StudentProject) => void;
  sharing?: boolean;
}

export const AchievementBadge = ({
  label,
  verified,
}: {
  label: string;
  verified: boolean;
}) => (
  <span
    className={
      verified
        ? "inline-flex items-center gap-1 rounded-full border border-secondary/40 bg-secondary/15 px-2 py-0.5 text-[11px] font-semibold text-secondary-foreground"
        : "inline-flex items-center gap-1 rounded-full border border-border bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground"
    }
    title={verified ? "Verified achievement" : "Achievement pending verification"}
  >
    {verified ? <BadgeCheck className="h-3 w-3 text-secondary" /> : <Clock className="h-3 w-3" />}
    {verified ? label : `${label} (pending)`}
  </span>
);

export const ProjectCard = ({
  project,
  isOwner,
  onEdit,
  onDelete,
  onShare,
  sharing,
}: ProjectCardProps) => {
  const tech = project.tech_stack || [];

  return (
    <Card className="overflow-hidden flex flex-col h-full hover:border-primary/50 transition-colors">
      <div className="aspect-video w-full bg-gradient-to-br from-primary/15 via-secondary/10 to-muted flex items-center justify-center overflow-hidden">
        {project.cover_image_url ? (
          <img
            src={project.cover_image_url}
            alt={`${project.title} cover image`}
            loading="lazy"
            className="h-full w-full object-cover"
          />
        ) : (
          <Code2 className="h-10 w-10 text-primary/40" />
        )}
      </div>

      <CardContent className="p-4 flex flex-col gap-3 flex-1">
        <div className="space-y-2">
          <h3 className="font-semibold leading-snug break-words">{project.title}</h3>
          {project.achievement_label && (
            <AchievementBadge
              label={project.achievement_label}
              verified={project.achievement_verified}
            />
          )}
          {project.description && (
            <p className="text-sm text-muted-foreground line-clamp-3 break-words">
              {project.description}
            </p>
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

        <div className="mt-auto flex flex-wrap items-center gap-2 pt-1">
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

        {isOwner && (
          <div className="flex items-center gap-1 border-t pt-2">
            <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => onEdit?.(project)}>
              <Pencil className="h-4 w-4" /> Edit
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5"
              onClick={() => onShare?.(project)}
              disabled={sharing}
            >
              <Share2 className="h-4 w-4" />
              {project.shared_post_id ? "Share again" : "Share to feed"}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 ml-auto text-destructive hover:text-destructive"
              onClick={() => onDelete?.(project)}
              aria-label="Delete project"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
