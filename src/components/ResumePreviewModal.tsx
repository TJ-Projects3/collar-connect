import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, ExternalLink, Loader2 } from "lucide-react";
import { fetchResumeBlobUrl, downloadResume, resumeErrorMessage } from "@/lib/resume-file";
import { useToast } from "@/hooks/use-toast";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Stored resume value: Base64 Data URI or legacy storage path/URL. */
  value: string | null | undefined;
  title?: string;
}

export const ResumePreviewModal = ({ open, onOpenChange, value, title = "Resume" }: Props) => {
  const [src, setSrc] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!open) {
      setSrc(null);
      setError(null);
      return;
    }
    let cancelled = false;
    let created: string | null = null;

    (async () => {
      try {
        const { blobUrl } = await fetchResumeBlobUrl(value);
        created = blobUrl;
        if (cancelled) {
          URL.revokeObjectURL(blobUrl);
          return;
        }
        setSrc(blobUrl);
      } catch (e) {
        if (!cancelled) setError(resumeErrorMessage(e));
      }
    })();

    return () => {
      cancelled = true;
      if (created) URL.revokeObjectURL(created);
    };
  }, [open, value]);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      await downloadResume(value);
    } catch (e) {
      toast({
        title: "Couldn't download the resume",
        description: resumeErrorMessage(e),
        variant: "destructive",
      });
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-[95vw] p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-4 py-3 border-b space-y-0">
          <div className="flex items-center justify-between gap-2 pr-8">
            <DialogTitle className="text-base truncate">{title}</DialogTitle>
            <div className="flex items-center gap-2">
              {src && (
                <Button variant="outline" size="sm" className="gap-2" asChild>
                  <a href={src} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4" /> New tab
                  </a>
                </Button>
              )}
              <Button size="sm" className="gap-2" onClick={handleDownload} disabled={downloading}>
                {downloading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                Download
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="bg-muted h-[75vh]">
          {error ? (
            <div className="h-full flex items-center justify-center p-6 text-center">
              <p className="text-sm text-muted-foreground">{error}</p>
            </div>
          ) : src ? (
            <iframe src={src} title={title} className="w-full h-full border-0" />
          ) : (
            <div className="h-full flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
