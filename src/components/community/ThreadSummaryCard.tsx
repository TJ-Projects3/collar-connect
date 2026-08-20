import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Sparkles, ChevronDown, ChevronUp, RefreshCw, AlertCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useThreadSummary, useSummarizeThread } from "@/hooks/useThreadSummary";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface ThreadSummaryCardProps {
  questionId: string;
  title: string;
  question: string;
  answers: string[];
  /** Minimum answers before summarizing is offered */
  threshold?: number;
}

export const ThreadSummaryCard = ({
  questionId,
  title,
  question,
  answers,
  threshold = 3,
}: ThreadSummaryCardProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { data: summary, isLoading } = useThreadSummary(questionId);
  const summarize = useSummarizeThread();
  const [open, setOpen] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const eligible = answers.length >= threshold;
  if (!eligible && !summary) return null;

  const stale = !!summary && summary.answer_count < answers.length;

  const run = () => {
    if (!user) {
      toast({ title: "Sign in to summarize this discussion" });
      return;
    }
    setError(null);
    setOpen(true);
    summarize.mutate(
      { questionId, title, question, answers },
      {
        onError: (e) => setError(e instanceof Error ? e.message : "Could not generate a summary."),
      },
    );
  };

  const pending = summarize.isPending;

  return (
    <Card className="border-secondary/40 bg-secondary/5">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Sparkles className="h-4 w-4 text-secondary shrink-0" />
            <h3 className="font-semibold text-sm">AI Summary</h3>
            {summary && (
              <span className="text-xs text-muted-foreground hidden sm:inline truncate">
                · {formatDistanceToNow(new Date(summary.updated_at), { addSuffix: true })}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {summary && !pending && (
              <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs" onClick={run}>
                <RefreshCw className="h-3.5 w-3.5" /> Regenerate
              </Button>
            )}
            {summary && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={() => setOpen((o) => !o)}
                aria-label={open ? "Collapse summary" : "Expand summary"}
              >
                {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            )}
          </div>
        </div>

        {isLoading && !summary && <Skeleton className="h-4 w-40" />}

        {!summary && !pending && !isLoading && (
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <p className="text-sm text-muted-foreground flex-1">
              This thread has {answers.length} replies. Get a 3-bullet executive summary.
            </p>
            <Button size="sm" className="gap-2" onClick={run}>
              <Sparkles className="h-4 w-4" /> Summarize Discussion
            </Button>
          </div>
        )}

        {pending && (
          <div className="space-y-2">
            <Skeleton className="h-3.5 w-full" />
            <Skeleton className="h-3.5 w-[92%]" />
            <Skeleton className="h-3.5 w-[78%]" />
            <p className="text-xs text-muted-foreground">Reading the thread…</p>
          </div>
        )}

        {error && !pending && (
          <div className="flex items-start gap-2 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
            <span className="break-words">{error}</span>
          </div>
        )}

        {summary && !pending && (
          <div className={cn("space-y-3", !open && "hidden")}>
            {stale && (
              <p className="text-xs text-muted-foreground">
                New replies since this summary — regenerate for the latest.
              </p>
            )}
            <ul className="space-y-2">
              {summary.bullets.map((b, i) => (
                <li key={i} className="flex gap-2 text-sm leading-relaxed">
                  <span className="text-secondary font-semibold">{i + 1}.</span>
                  <span className="break-words">{b}</span>
                </li>
              ))}
            </ul>
            {summary.takeaway && (
              <p className="text-sm font-medium border-t border-secondary/30 pt-2 break-words">
                Takeaway: <span className="font-normal">{summary.takeaway}</span>
              </p>
            )}
            <p className="text-[11px] text-muted-foreground">
              AI-generated from the replies above. Verify before acting on it.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
