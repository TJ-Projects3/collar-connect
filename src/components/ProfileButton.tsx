import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Edit } from "lucide-react";
import { EditProfileModal } from "@/components/profile/EditProfileModal";

interface ProfileButtonProps {
  /** Optional controlled open state so other cards can open the same modal. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export const ProfileButton = ({ open, onOpenChange }: ProfileButtonProps) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = open !== undefined && !!onOpenChange;
  const isOpen = isControlled ? (open as boolean) : internalOpen;
  const setOpen = isControlled ? (onOpenChange as (o: boolean) => void) : setInternalOpen;

  return (
    <>
      <Button className="gap-2" onClick={() => setOpen(true)}>
        <Edit className="h-4 w-4" />
        Edit Profile
      </Button>

      <EditProfileModal open={isOpen} onOpenChange={setOpen} />
    </>
  );
};
