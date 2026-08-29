import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface ApplyConfirmDialogProps {
  open: boolean;
  company: string | null;
  title: string | null;
  isPending?: boolean;
  onConfirm: () => void;
  onDismiss: () => void;
}

export const ApplyConfirmDialog = ({
  open,
  company,
  title,
  isPending,
  onConfirm,
  onDismiss,
}: ApplyConfirmDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={(next) => !next && onDismiss()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Did you apply to {company ?? "this company"}?</DialogTitle>
          <DialogDescription>
            {title
              ? `We can add "${title}" to your tracker so you can follow up later.`
              : "We can add this role to your tracker so you can follow up later."}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-col gap-2 sm:flex-row">
          <Button variant="outline" onClick={onDismiss} className="w-full sm:w-auto">
            Just browsing
          </Button>
          <Button onClick={onConfirm} disabled={isPending} className="w-full sm:w-auto">
            Mark as applied
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
