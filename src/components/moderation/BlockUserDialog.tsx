import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useBlockUser } from "@/hooks/useBlockedUsers";

interface BlockUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  userName?: string | null;
}

export const BlockUserDialog = ({ open, onOpenChange, userId, userName }: BlockUserDialogProps) => {
  const blockUser = useBlockUser();

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Block {userName || "this user"}?</AlertDialogTitle>
          <AlertDialogDescription>
            Their posts, comments, questions and answers will be hidden from you right away, and
            neither of you will be able to send the other direct messages. You can unblock them
            later from Settings.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            onClick={() => blockUser.mutate(userId, { onSuccess: () => onOpenChange(false) })}
          >
            Block user
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
