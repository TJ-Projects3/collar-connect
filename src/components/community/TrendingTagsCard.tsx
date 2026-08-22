import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Hash, TrendingUp } from "lucide-react";
import { useQuestionTagCounts } from "@/hooks/useQuestionTags";
import { cn } from "@/lib/utils";

interface Props {
  activeTag: string | null;
  onSelect: (tag: string | null) => void;
  limit?: number;
}

export const TrendingTagsCard = ({ activeTag, onSelect, limit = 8 }: Props) => {
  const { data: tags = [], isLoading } = useQuestionTagCounts(limit);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-secondary" />
            <h3 className="font-semibold">Trending Topics</h3>
          </div>
          {activeTag && (
            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => onSelect(null)}>
              Clear
            </Button>
          )}
        </div>
        <p className="text-xs text-muted-foreground">Tap a tag to filter the Q&amp;A feed.</p>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex flex-wrap gap-2">
            <Skeleton className="h-7 w-20 rounded-full" />
            <Skeleton className="h-7 w-24 rounded-full" />
            <Skeleton className="h-7 w-16 rounded-full" />
          </div>
        ) : tags.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No tags yet — add tags when you ask a question so others can find it.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {tags.map(({ tag, count }) => {
              const active = activeTag === tag;
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => onSelect(active ? null : tag)}
                  aria-pressed={active}
                  className={cn(
                    "inline-flex min-h-8 items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                    active
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-background text-muted-foreground hover:bg-muted"
                  )}
                >
                  <Hash className="h-3 w-3" />
                  <span className="break-words">{tag}</span>
                  <span className={cn("tabular-nums", active ? "opacity-80" : "text-muted-foreground/70")}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
