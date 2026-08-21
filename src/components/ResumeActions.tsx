import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FileText, Download, Loader2 } from "lucide-react";
import { ResumePreviewModal } from "./ResumePreviewModal";
import { resolveResumeUrl, getStoredFileName } from "@/lib/portfolio-validation";
import { downloadResume, resumeErrorMessage } from "@/lib/resume-file";
import { useToast } from "@/hooks/use-toast";

interface Props {
  /** Raw stored resume value (data URI or storage URL). */
  value?: string | null;
  className?: string;
}

/**
 * Profile-level resume actions (view + download).
 * Shared so the header action row and any other placement behave identically.
 */
export const ResumeActions = ({ value, className }: Props) => {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const { toast } = useToast();

  if (!resolveResumeUrl(value)) return null;

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
    <>
      <Button variant="outline" className={`gap-2 ${className ?? ""}`} onClick={() => setPreviewOpen(true)}>
        <FileText className="h-4 w-4" />
        Resume
      </Button>
      <Button
        variant="ghost"
        size="icon"
        aria-label="Download resume"
        title="Download resume"
        disabled={downloading}
        onClick={handleDownload}
      >
        {downloading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Download className="h-4 w-4" />
        )}
      </Button>

      <ResumePreviewModal
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        value={value}
        title={getStoredFileName(value, "Resume")}
      />
    </>
  );
};
