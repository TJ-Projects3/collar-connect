import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Flag, MoreHorizontal, Pencil, Share2, Trash2, UserX } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { TARGET_LABEL, type ReportTargetType } from "@/hooks/useContentReports";
import { ReportContentDialog } from "@/components/moderation/ReportContentDialog";
import { BlockUserDialog } from "@/components/moderation/BlockUserDialog";

interface ContentActionsMenuProps {
  targetType: ReportTargetType;
  targetId: string;
  authorId?: string | null;
  authorName?: string | null;
  contentPreview?: string | null;
  /** Hide the block option (e.g. anonymous Q&A content) */
  allowBlock?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  /** Secondary share/copy-link action, shown at the top of the menu */
  onShare?: () => void;
  size?: "sm" | "default";
  className?: string;
}

export const ContentActionsMenu = ({
  targetType,
  targetId,
  authorId,
  authorName,
  contentPreview,
  allowBlock = true,
  onEdit,
  onDelete,
  onShare,
  size = "default",
  className,
}: ContentActionsMenuProps) => {
  const { user } = useAuth();
  const [reportOpen, setReportOpen] = useState(false);
  const [blockOpen, setBlockOpen] = useState(false);

  const isOwn = !!user?.id && user.id === authorId;
  const canBlock = allowBlock && !isOwn && !!authorId;
  const label = TARGET_LABEL[targetType];
  const iconSize = size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4";

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className={`${size === "sm" ? "h-6 w-6" : ""} text-muted-foreground hover:text-foreground ${className ?? ""}`}
            aria-label={`More options for this ${label}`}
          >
            <MoreHorizontal className={iconSize} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          {onShare && (
            <>
              <DropdownMenuItem onSelect={onShare}>
                <Share2 className="mr-2 h-4 w-4" />
                Share {label}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          )}
          {!isOwn && (
            <DropdownMenuItem onSelect={() => setReportOpen(true)}>
              <Flag className="mr-2 h-4 w-4" />
              Report {label}
            </DropdownMenuItem>
          )}
          {canBlock && (
            <DropdownMenuItem onSelect={() => setBlockOpen(true)}>
              <UserX className="mr-2 h-4 w-4" />
              Block user
            </DropdownMenuItem>
          )}
          {isOwn && (onEdit || onDelete) && (
            <>
              {onEdit && (
                <DropdownMenuItem onSelect={onEdit}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit {label}
                </DropdownMenuItem>
              )}
              {onDelete && (
                <>
                  {onEdit && <DropdownMenuSeparator />}
                  <DropdownMenuItem
                    onSelect={onDelete}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete {label}
                  </DropdownMenuItem>
                </>
              )}
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <ReportContentDialog
        open={reportOpen}
        onOpenChange={setReportOpen}
        targetType={targetType}
        targetId={targetId}
        targetAuthorId={authorId}
        contentPreview={contentPreview}
      />

      {canBlock && authorId && (
        <BlockUserDialog
          open={blockOpen}
          onOpenChange={setBlockOpen}
          userId={authorId}
          userName={authorName}
        />
      )}
    </>
  );
};
