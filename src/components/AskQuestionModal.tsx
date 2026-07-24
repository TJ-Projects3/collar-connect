import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { X, ShieldAlert } from "lucide-react";
import { useCreateQuestion } from "@/hooks/useQuestions";

interface AskQuestionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (id: string) => void;
}

export const AskQuestionModal = ({ open, onOpenChange, onCreated }: AskQuestionModalProps) => {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const createQuestion = useCreateQuestion();

  const reset = () => {
    setTitle("");
    setBody("");
    setTagInput("");
    setTags([]);
    setIsAnonymous(false);
  };

  const addTag = () => {
    const t = tagInput.trim().replace(/^#/, "").toLowerCase();
    if (!t || tags.includes(t) || tags.length >= 5) return;
    setTags([...tags, t]);
    setTagInput("");
  };

  const submit = () => {
    if (!title.trim()) return;
    createQuestion.mutate(
      { title, body, tags, isAnonymous },
      {
        onSuccess: (row: any) => {
          reset();
          onOpenChange(false);
          onCreated?.(row.id);
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) reset(); onOpenChange(o); }}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Ask the community</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Title</label>
            <Input
              placeholder="e.g., How do I break into cybersecurity as a CS student?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={200}
            />
            <p className="text-xs text-muted-foreground mt-1">Be specific. Imagine you're asking a mentor.</p>
          </div>
          <div>
            <label className="text-sm font-medium">Details (optional)</label>
            <Textarea
              placeholder="Add context, what you've tried, and what advice you need..."
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={6}
              maxLength={5000}
            />
          </div>
          <div>
            <label className="text-sm font-medium">Tags <span className="text-muted-foreground font-normal">({tags.length}/5)</span></label>
            <div className="flex gap-2 mt-1">
              <Input
                placeholder="e.g. internships"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === ",") {
                    e.preventDefault();
                    addTag();
                  }
                }}
                disabled={tags.length >= 5}
              />
              <Button type="button" variant="outline" onClick={addTag} disabled={tags.length >= 5}>
                Add
              </Button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {tags.map((t) => (
                  <Badge key={t} variant="secondary" className="gap-1">
                    #{t}
                    <button onClick={() => setTags(tags.filter((x) => x !== t))} aria-label={`Remove ${t}`}>
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-md border bg-muted/40 p-3">
            <label className="flex items-start gap-3 cursor-pointer">
              <Checkbox
                checked={isAnonymous}
                onCheckedChange={(v) => setIsAnonymous(!!v)}
                className="mt-0.5"
              />
              <div className="space-y-1">
                <div className="text-sm font-medium">Post anonymously</div>
                <p className="text-xs text-muted-foreground flex items-start gap-1">
                  <ShieldAlert className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                  Your name and avatar won't be shown to the community. Moderators can still see who posted for safety and abuse enforcement.
                </p>
              </div>
            </label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit} disabled={!title.trim() || createQuestion.isPending}>
            {createQuestion.isPending ? "Posting..." : "Post Question"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
