import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building2, ExternalLink, Loader2, MapPin, Trash2 } from "lucide-react";
import { format } from "date-fns";
import {
  TRACKER_STATUSES,
  type JobApplicationStatus,
  type TrackedJob,
} from "@/hooks/useJobApplications";

interface TrackerBoardProps {
  items: TrackedJob[];
  isLoading: boolean;
  onStatusChange: (jobId: string, status: JobApplicationStatus) => void;
  onNotesSave: (jobId: string, notes: string) => void;
  onRemove: (jobId: string) => void;
}

const isSafeUrl = (url: string | null | undefined): boolean => {
  if (!url) return false;
  try {
    return ["http:", "https:"].includes(new URL(url).protocol);
  } catch {
    return false;
  }
};

export const TrackerBoard = ({
  items,
  isLoading,
  onStatusChange,
  onNotesSave,
  onRemove,
}: TrackerBoardProps) => {
  const [activeStatus, setActiveStatus] = useState<string>("all");
  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({});

  const counts = useMemo(() => {
    const map: Record<string, number> = { all: items.length };
    for (const s of TRACKER_STATUSES) {
      map[s.value] = items.filter((i) => i.status === s.value).length;
    }
    return map;
  }, [items]);

  const visible = useMemo(
    () => (activeStatus === "all" ? items : items.filter((i) => i.status === activeStatus)),
    [items, activeStatus],
  );

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border py-12 text-center">
        <p className="font-medium text-foreground">Your tracker is empty</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Save a job with the bookmark icon, or mark a role as applied after you apply.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Tabs value={activeStatus} onValueChange={setActiveStatus}>
        <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1">
          <TabsTrigger value="all">All ({counts.all})</TabsTrigger>
          {TRACKER_STATUSES.map((s) => (
            <TabsTrigger key={s.value} value={s.value}>
              {s.label} ({counts[s.value] ?? 0})
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {visible.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          Nothing in this stage yet.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {visible.map((item) => {
            const draft = noteDrafts[item.job_id] ?? item.notes ?? "";
            const applyUrl = item.job?.external_url ?? item.job?.source_url ?? null;

            return (
              <Card key={item.id} className="rounded-xl border-border/50">
                <CardHeader className="space-y-2 pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 space-y-1">
                      <CardTitle className="text-base leading-tight">
                        {item.job?.title ?? "Listing no longer available"}
                      </CardTitle>
                      {item.job?.company && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Building2 className="h-3.5 w-3.5" />
                          <span className="font-medium">{item.job.company}</span>
                        </div>
                      )}
                    </div>
                    {item.job?.track && (
                      <Badge variant="secondary" className="shrink-0">
                        {item.job.track}
                      </Badge>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    {item.job?.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {item.job.location}
                      </span>
                    )}
                    {item.status !== "saved" && item.applied_at && (
                      <span>Applied {format(new Date(item.applied_at), "MMM d, yyyy")}</span>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Status</Label>
                    <Select
                      value={item.status}
                      onValueChange={(value) =>
                        onStatusChange(item.job_id, value as JobApplicationStatus)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TRACKER_STATUSES.map((s) => (
                          <SelectItem key={s.value} value={s.value}>
                            {s.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor={`notes-${item.id}`} className="text-xs font-medium">
                      Notes
                    </Label>
                    <Textarea
                      id={`notes-${item.id}`}
                      value={draft}
                      placeholder="Recruiter contact, interview date, follow-up reminders..."
                      rows={2}
                      onChange={(e) =>
                        setNoteDrafts((prev) => ({ ...prev, [item.job_id]: e.target.value }))
                      }
                    />
                    {draft !== (item.notes ?? "") && (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => onNotesSave(item.job_id, draft)}
                      >
                        Save notes
                      </Button>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {isSafeUrl(applyUrl) && (
                      <Button asChild size="sm" variant="outline">
                        <a href={applyUrl!} target="_blank" rel="noopener noreferrer">
                          View listing
                          <ExternalLink className="ml-2 h-3.5 w-3.5" />
                        </a>
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive hover:text-destructive"
                      onClick={() => onRemove(item.job_id)}
                    >
                      <Trash2 className="mr-2 h-3.5 w-3.5" />
                      Remove
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
