import { useState, type KeyboardEvent } from "react";
import { ModalActions } from "@/components/layout/ModalActions";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  REPORT_REASONS,
  TARGET_LABEL,
  useSubmitReport,
  type ReportReason,
  type ReportTargetType,
} from "@/hooks/useContentReports";

const stopSpaceKeyPropagation = (e: KeyboardEvent<HTMLElement>) => {
  if (e.key === " ") e.stopPropagation();
};

interface ReportContentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetType: ReportTargetType;
  targetId: string;
  targetAuthorId?: string | null;
  contentPreview?: string | null;
}

export const ReportContentDialog = ({
  open,
  onOpenChange,
  targetType,
  targetId,
  targetAuthorId,
  contentPreview,
}: ReportContentDialogProps) => {
  const [reason, setReason] = useState<ReportReason>("spam");
  const [details, setDetails] = useState("");
  const submitReport = useSubmitReport();

  const handleSubmit = () => {
    submitReport.mutate(
      { targetType, targetId, targetAuthorId, contentPreview, reason, details },
      {
        onSuccess: () => {
          setDetails("");
          setReason("spam");
          onOpenChange(false);
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Report this {TARGET_LABEL[targetType]}</DialogTitle>
          <DialogDescription>
            Tell us what's wrong. Reports are private and reviewed by the NextGen Collar team.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <RadioGroup value={reason} onValueChange={(v) => setReason(v as ReportReason)}>
            {REPORT_REASONS.map((r) => (
              <div key={r.value} className="flex items-center gap-2">
                <RadioGroupItem value={r.value} id={`reason-${r.value}`} />
                <Label htmlFor={`reason-${r.value}`} className="font-normal cursor-pointer">
                  {r.label}
                </Label>
              </div>
            ))}
          </RadioGroup>

          <div className="space-y-1.5">
            <Label htmlFor="report-details">Additional details (optional)</Label>
            <Textarea
              id="report-details"
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              onKeyDownCapture={stopSpaceKeyPropagation}
              onKeyDown={stopSpaceKeyPropagation}
              placeholder="Add anything that helps us review this faster"
              className="min-h-[90px]"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitReport.isPending}>
            {submitReport.isPending ? "Submitting..." : "Submit report"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
