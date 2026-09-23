import { Badge } from "@/components/ui/badge";
import { CheckCircle2, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";

interface QuestionStatusBadgeProps {
  answerCount: number;
  hasAcceptedAnswer: boolean;
  className?: string;
}

export const QuestionStatusBadge = ({
  answerCount,
  hasAcceptedAnswer,
  className,
}: QuestionStatusBadgeProps) => {
  if (hasAcceptedAnswer) {
    return (
      <Badge
        className={cn(
          "shrink-0 max-w-full whitespace-nowrap gap-1.5 px-2.5 py-1 text-xs font-medium bg-success text-success-foreground hover:bg-success",
          className
        )}
      >
        <CheckCircle2 className="h-3.5 w-3.5" />
        Resolved
        {answerCount > 0 && (
          <span className="opacity-90">
            ({answerCount} {answerCount === 1 ? "answer" : "answers"})
          </span>
        )}
      </Badge>
    );
  }

  if (answerCount > 0) {
    return (
      <Badge
        variant="secondary"
        className={cn("shrink-0 max-w-full whitespace-nowrap gap-1.5 px-2.5 py-1 text-xs font-medium", className)}
      >
        <MessageSquare className="h-3.5 w-3.5" />
        Active Discussion ({answerCount} {answerCount === 1 ? "answer" : "answers"})
      </Badge>
    );
  }

  return (
    <Badge
      variant="outline"
      className={cn(
        "shrink-0 max-w-full whitespace-nowrap gap-1.5 px-2.5 py-1 text-xs font-medium text-muted-foreground",
        className
      )}
    >
      <MessageSquare className="h-3.5 w-3.5" />
      No Answers Yet
    </Badge>
  );
};
