import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Award, Pencil, Plus, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { EndorsementFormModal } from "./EndorsementFormModal";
import { EndorsementPill } from "@/components/endorsements/EndorsementBadges";
import {
  useAllEndorsements, useDeleteEndorsement,
  type Endorsement, type EndorsementWithMeta,
} from "@/hooks/useEndorsements";

const initials = (name?: string | null) =>
  (name || "U")
    .split(" ")
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

export const EndorsementsTab = () => {
  const { data: endorsements, isLoading } = useAllEndorsements();
  const deleteEndorsement = useDeleteEndorsement();

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Endorsement | null>(null);
  const [pendingDelete, setPendingDelete] = useState<EndorsementWithMeta | null>(null);

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-3">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5 text-primary" />
            Official Endorsements
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Award verified NextGen achievement badges to students.
          </p>
        </div>
        <Button
          className="gap-2 flex-shrink-0"
          onClick={() => {
            setEditing(null);
            setModalOpen(true);
          }}
        >
          <Plus className="h-4 w-4" /> New endorsement
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <p className="text-muted-foreground text-center py-6">Loading...</p>
        ) : !endorsements || endorsements.length === 0 ? (
          <p className="text-muted-foreground text-center py-6">
            No endorsements awarded yet.
          </p>
        ) : (
          endorsements.map((e) => (
            <div
              key={e.id}
              className="flex flex-col sm:flex-row sm:items-start gap-3 border rounded-lg p-4"
            >
              <Avatar className="h-10 w-10 flex-shrink-0">
                <AvatarImage src={e.student?.avatar_url || undefined} />
                <AvatarFallback>{initials(e.student?.full_name)}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0 space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    to={`/profile?userId=${e.student_id}`}
                    className="font-semibold hover:underline break-words"
                  >
                    {e.student?.full_name || "Unknown student"}
                  </Link>
                  <EndorsementPill title={e.badge_title} />
                </div>
                {e.description && (
                  <p className="text-sm text-muted-foreground break-words">{e.description}</p>
                )}
                {e.project && (
                  <p className="text-xs text-muted-foreground">
                    Linked project: <span className="font-medium">{e.project.title}</span>
                  </p>
                )}
              </div>
              <div className="flex items-center gap-1 sm:flex-shrink-0">
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1.5"
                  onClick={() => {
                    setEditing(e);
                    setModalOpen(true);
                  }}
                >
                  <Pencil className="h-4 w-4" /> Edit
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:text-destructive"
                  onClick={() => setPendingDelete(e)}
                  aria-label="Remove endorsement"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))
        )}
      </CardContent>

      <EndorsementFormModal
        open={modalOpen}
        onOpenChange={(open) => {
          setModalOpen(open);
          if (!open) setEditing(null);
        }}
        endorsement={editing}
      />

      <AlertDialog open={!!pendingDelete} onOpenChange={(open) => !open && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove this endorsement?</AlertDialogTitle>
            <AlertDialogDescription>
              "{pendingDelete?.badge_title}" will no longer appear on{" "}
              {pendingDelete?.student?.full_name || "this student"}'s profile.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (pendingDelete) deleteEndorsement.mutate(pendingDelete);
                setPendingDelete(null);
              }}
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};
