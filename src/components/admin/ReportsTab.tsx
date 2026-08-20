import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Flag, Trash2, X } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Link } from "react-router-dom";
import {
  REPORT_REASONS,
  TARGET_LABEL,
  useContentReports,
  useResolveReport,
  type ReportStatus,
} from "@/hooks/useContentReports";

const reasonLabel = (value: string) =>
  REPORT_REASONS.find((r) => r.value === value)?.label ?? value;

export const ReportsTab = () => {
  const [status, setStatus] = useState<ReportStatus | "all">("open");
  const { data: reports = [], isLoading } = useContentReports(status);
  const resolve = useResolveReport();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Flag className="h-5 w-5 text-primary" />
          Reported content
        </CardTitle>
        <CardDescription>
          Review reports from members and remove content that breaks the community rules.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs value={status} onValueChange={(v) => setStatus(v as ReportStatus | "all")}>
          <TabsList>
            <TabsTrigger value="open">Open</TabsTrigger>
            <TabsTrigger value="reviewed">Actioned</TabsTrigger>
            <TabsTrigger value="dismissed">Dismissed</TabsTrigger>
            <TabsTrigger value="all">All</TabsTrigger>
          </TabsList>
        </Tabs>

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading reports...</p>
        ) : reports.length === 0 ? (
          <p className="text-sm text-muted-foreground">No reports here.</p>
        ) : (
          <div className="space-y-3">
            {reports.map((report) => (
              <div key={report.id} className="rounded-lg border p-4 space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary" className="capitalize">
                    {TARGET_LABEL[report.target_type]}
                  </Badge>
                  <Badge variant="outline">{reasonLabel(report.reason)}</Badge>
                  <Badge variant={report.status === "open" ? "default" : "outline"} className="capitalize">
                    {report.status}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(report.created_at), { addSuffix: true })}
                  </span>
                </div>

                {report.content_preview && (
                  <p className="text-sm bg-muted/50 rounded-md p-3 whitespace-pre-wrap break-words">
                    {report.content_preview}
                  </p>
                )}

                {report.details && (
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">Reporter note: </span>
                    {report.details}
                  </p>
                )}

                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  <span>
                    Reported by{" "}
                    <Link className="hover:underline" to={`/profile?userId=${report.reporter_id}`}>
                      {report.reporter?.full_name || "Unknown member"}
                    </Link>
                  </span>
                  {report.target_author_id && (
                    <span>
                      Author{" "}
                      <Link className="hover:underline" to={`/profile?userId=${report.target_author_id}`}>
                        {report.author?.full_name || "Unknown member"}
                      </Link>
                    </span>
                  )}
                </div>

                {report.status === "open" && (
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="destructive"
                      disabled={resolve.isPending}
                      onClick={() => resolve.mutate({ report, action: "remove" })}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Remove content
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={resolve.isPending}
                      onClick={() => resolve.mutate({ report, action: "dismiss" })}
                    >
                      <X className="mr-2 h-4 w-4" />
                      Dismiss
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
