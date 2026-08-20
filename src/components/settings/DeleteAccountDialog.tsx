import { useState, type KeyboardEvent } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertTriangle } from "lucide-react";
import { useDeleteAccount } from "@/hooks/useDeleteAccount";

const stopSpaceKeyPropagation = (e: KeyboardEvent<HTMLElement>) => {
  if (e.key === " ") e.stopPropagation();
};

interface DeleteAccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const DeleteAccountDialog = ({ open, onOpenChange }: DeleteAccountDialogProps) => {
  const [confirmText, setConfirmText] = useState("");
  const deleteAccount = useDeleteAccount();

  const canDelete = confirmText.trim().toUpperCase() === "DELETE";

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!deleteAccount.isPending) {
          setConfirmText("");
          onOpenChange(next);
        }
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Delete your account
          </DialogTitle>
          <DialogDescription>
            This is permanent and cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm">
            <p className="font-medium mb-1">Everything below is permanently removed:</p>
            <ul className="list-disc pl-5 space-y-0.5 text-muted-foreground">
              <li>Your profile, photo and resume</li>
              <li>Your posts, comments and reactions</li>
              <li>Your Q&amp;A questions and answers</li>
              <li>Your direct messages and connections</li>
              <li>Your projects, endorsements and career results</li>
            </ul>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="delete-confirm">
              Type <span className="font-semibold">DELETE</span> to confirm
            </Label>
            <Input
              id="delete-confirm"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              onKeyDownCapture={stopSpaceKeyPropagation}
              onKeyDown={stopSpaceKeyPropagation}
              placeholder="DELETE"
              autoComplete="off"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={deleteAccount.isPending}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            disabled={!canDelete || deleteAccount.isPending}
            onClick={() => deleteAccount.mutate()}
          >
            {deleteAccount.isPending ? "Deleting..." : "Delete my account"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
