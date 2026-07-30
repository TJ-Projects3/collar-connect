import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, FolderOpen } from "lucide-react";
import { ProjectCard } from "./ProjectCard";
import { ProjectFormModal } from "./ProjectFormModal";
import {
  useStudentProjects, useDeleteProject, useShareProjectToFeed,
  type StudentProject,
} from "@/hooks/useStudentProjects";
import { useStudentEndorsements } from "@/hooks/useEndorsements";

interface Props {
  userId: string | null | undefined;
  isOwnProfile: boolean;
}

export const ProjectsGrid = ({ userId, isOwnProfile }: Props) => {
  const { data: projects = [], isLoading } = useStudentProjects(userId);
  const deleteProject = useDeleteProject();
  const shareProject = useShareProjectToFeed();
  const { data: endorsements = [] } = useStudentEndorsements(userId);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<StudentProject | null>(null);
  const [pendingDelete, setPendingDelete] = useState<StudentProject | null>(null);

  return (
    <div className="space-y-4">
      {isOwnProfile && (
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold">Projects</h2>
            <p className="text-sm text-muted-foreground">
              Showcase what you've built. Share to the feed for feedback.
            </p>
          </div>
          <Button
            onClick={() => {
              setEditing(null);
              setModalOpen(true);
            }}
            className="gap-2 flex-shrink-0"
          >
            <Plus className="h-4 w-4" /> Add Project
          </Button>
        </div>
      )}

      {isLoading ? (
        <Card>
          <CardContent className="p-6 text-center text-muted-foreground">Loading projects...</CardContent>
        </Card>
      ) : projects.length === 0 ? (
        <Card>
          <CardContent className="p-10 text-center space-y-3">
            <FolderOpen className="h-8 w-8 text-muted-foreground mx-auto" />
            <p className="text-muted-foreground">
              {isOwnProfile
                ? "No projects yet. Add your first project to start building your portfolio."
                : "This student hasn't added any projects yet."}
            </p>
            {isOwnProfile && (
              <Button
                variant="outline"
                onClick={() => {
                  setEditing(null);
                  setModalOpen(true);
                }}
                className="gap-2"
              >
                <Plus className="h-4 w-4" /> Add Project
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {projects.map((p) => (
            <ProjectCard
              key={p.id}
              project={p}
              isOwner={isOwnProfile}
              endorsements={endorsements.filter((e) => e.project_id === p.id)}
              sharing={shareProject.isPending}
              onEdit={(proj) => {
                setEditing(proj);
                setModalOpen(true);
              }}
              onDelete={(proj) => setPendingDelete(proj)}
              onShare={(proj) => shareProject.mutate(proj)}
            />
          ))}
        </div>
      )}

      {isOwnProfile && (
        <ProjectFormModal
          open={modalOpen}
          onOpenChange={(open) => {
            setModalOpen(open);
            if (!open) setEditing(null);
          }}
          project={editing}
        />
      )}

      <AlertDialog open={!!pendingDelete} onOpenChange={(open) => !open && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this project?</AlertDialogTitle>
            <AlertDialogDescription>
              "{pendingDelete?.title}" will be removed from your profile. Any feed post you shared stays up.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (pendingDelete) deleteProject.mutate(pendingDelete.id);
                setPendingDelete(null);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
