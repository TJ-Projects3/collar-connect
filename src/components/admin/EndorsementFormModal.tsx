import { useEffect, useMemo, useState } from "react";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useStudentProjects } from "@/hooks/useStudentProjects";
import {
  useBadgeTitles, useSaveEndorsement, useStudentDirectory,
  type Endorsement,
} from "@/hooks/useEndorsements";

const CREATE_NEW = "__create_new__";
const NO_PROJECT = "__none__";

const stopSpace = (e: React.KeyboardEvent) => {
  if (e.key === " ") e.stopPropagation();
};

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  endorsement?: Endorsement | null;
}

export const EndorsementFormModal = ({ open, onOpenChange, endorsement }: Props) => {
  const { toast } = useToast();
  const { data: students = [] } = useStudentDirectory();
  const badgeTitles = useBadgeTitles();
  const save = useSaveEndorsement();

  const [studentQuery, setStudentQuery] = useState("");
  const [studentId, setStudentId] = useState("");
  const [titleChoice, setTitleChoice] = useState("");
  const [customTitle, setCustomTitle] = useState("");
  const [description, setDescription] = useState("");
  const [projectId, setProjectId] = useState(NO_PROJECT);

  const { data: projects = [] } = useStudentProjects(studentId || null);

  useEffect(() => {
    if (!open) return;
    if (endorsement) {
      setStudentId(endorsement.student_id);
      const known = badgeTitles.includes(endorsement.badge_title);
      setTitleChoice(known ? endorsement.badge_title : CREATE_NEW);
      setCustomTitle(known ? "" : endorsement.badge_title);
      setDescription(endorsement.description || "");
      setProjectId(endorsement.project_id || NO_PROJECT);
    } else {
      setStudentId("");
      setTitleChoice("");
      setCustomTitle("");
      setDescription("");
      setProjectId(NO_PROJECT);
    }
    setStudentQuery("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, endorsement?.id]);

  const visibleStudents = useMemo(() => {
    const q = studentQuery.trim().toLowerCase();
    if (!q) return students;
    return students.filter((s) =>
      [s.full_name, s.university].filter(Boolean).join(" ").toLowerCase().includes(q)
    );
  }, [students, studentQuery]);

  const finalTitle = titleChoice === CREATE_NEW ? customTitle.trim() : titleChoice;

  const handleSubmit = () => {
    if (!studentId) {
      toast({ title: "Select a student", variant: "destructive" });
      return;
    }
    if (!finalTitle) {
      toast({ title: "Add a badge title", variant: "destructive" });
      return;
    }

    save.mutate(
      {
        id: endorsement?.id,
        input: {
          student_id: studentId,
          badge_title: finalTitle,
          description,
          project_id: projectId === NO_PROJECT ? null : projectId,
        },
      },
      { onSuccess: () => onOpenChange(false) }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{endorsement ? "Edit endorsement" : "New official endorsement"}</DialogTitle>
          <DialogDescription>
            Award a verified NextGen achievement badge to a student, optionally tied to one of
            their projects.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Student</Label>
            <Input
              value={studentQuery}
              onChange={(e) => setStudentQuery(e.target.value)}
              onKeyDownCapture={stopSpace}
              placeholder="Search students by name or school..."
            />
            <Select value={studentId} onValueChange={setStudentId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a student" />
              </SelectTrigger>
              <SelectContent>
                {visibleStudents.length === 0 ? (
                  <div className="px-2 py-3 text-sm text-muted-foreground">No students found</div>
                ) : (
                  visibleStudents.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.full_name || "Unnamed student"}
                      {s.university ? ` — ${s.university}` : ""}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Achievement badge</Label>
            <Select value={titleChoice} onValueChange={setTitleChoice}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a badge title" />
              </SelectTrigger>
              <SelectContent>
                {badgeTitles.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
                <SelectItem value={CREATE_NEW}>+ Create new badge title</SelectItem>
              </SelectContent>
            </Select>
            {titleChoice === CREATE_NEW && (
              <Input
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                onKeyDownCapture={stopSpace}
                placeholder="e.g. NextGen Outstanding Intern"
                maxLength={80}
              />
            )}
          </div>

          <div className="space-y-2">
            <Label>Endorsement description</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onKeyDownCapture={stopSpace}
              rows={4}
              maxLength={600}
              placeholder="Describe why this student earned the badge — impact, leadership, results..."
            />
          </div>

          <div className="space-y-2">
            <Label>Linked project (optional)</Label>
            <Select value={projectId} onValueChange={setProjectId} disabled={!studentId}>
              <SelectTrigger>
                <SelectValue placeholder={studentId ? "No project" : "Select a student first"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NO_PROJECT}>No project</SelectItem>
                {projects.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={save.isPending}>
            {save.isPending ? "Saving..." : endorsement ? "Save changes" : "Award badge"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
