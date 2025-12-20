import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Link2, Check } from "lucide-react";
import { useCopyPostLink } from "@/hooks/usePostShares";

interface ShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  postId: string;
}

export const ShareDialog = ({ open, onOpenChange, postId }: ShareDialogProps) => {
  const { copyLink } = useCopyPostLink();

  const handleCopyLink = () => {
    copyLink(postId);
    // Keep dialog open briefly to show feedback, then close
    setTimeout(() => onOpenChange(false), 1000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Share Post</DialogTitle>
          <DialogDescription>
            Share this post with others by copying the link
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 pt-4">
          <Button
            onClick={handleCopyLink}
            variant="outline"
            className="w-full justify-start gap-3"
          >
            <Link2 className="h-4 w-4" />
            Copy link to post
          </Button>

          <div className="text-sm text-muted-foreground text-center">
            More sharing options coming soon!
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
