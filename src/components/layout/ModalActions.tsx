import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ModalActionsProps {
  /** Primary action label, e.g. "Post" or "Save changes" */
  submitLabel: string;
  /** Label shown while the action is running, e.g. "Posting..." */
  pendingLabel?: string;
  onSubmit?: () => void;
  onCancel: () => void;
  cancelLabel?: string;
  isPending?: boolean;
  /** Disable the primary action (validation) */
  disabled?: boolean;
  /** Render the primary button as a form submit button */
  type?: "button" | "submit";
  destructive?: boolean;
  className?: string;
}

/**
 * Standard modal footer actions: secondary Cancel then brand primary action
 * with a consistent spinner + disabled state while pending.
 */
export const ModalActions = ({
  submitLabel,
  pendingLabel,
  onSubmit,
  onCancel,
  cancelLabel = "Cancel",
  isPending = false,
  disabled = false,
  type = "button",
  destructive = false,
  className,
}: ModalActionsProps) => (
  <div className={cn("flex flex-col-reverse gap-2 sm:flex-row sm:justify-end", className)}>
    <Button type="button" variant="ghost" onClick={onCancel} disabled={isPending} className="sm:min-w-[100px]">
      {cancelLabel}
    </Button>
    <Button
      type={type}
      variant={destructive ? "destructive" : "default"}
      onClick={type === "submit" ? undefined : onSubmit}
      disabled={disabled || isPending}
      className="gap-2 sm:min-w-[120px]"
    >
      {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
      {isPending ? pendingLabel ?? `${submitLabel}...` : submitLabel}
    </Button>
  </div>
);
