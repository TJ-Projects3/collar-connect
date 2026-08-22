import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CalendarClock } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { MentorshipRequestModal } from "@/components/mentorship/MentorshipRequestModal";
import { cn } from "@/lib/utils";

/** True when this profile is an industry mentor open to 1-on-1s. */
export const isBookableMentor = (p: any) =>
  !!p &&
  p.profile_type === "industry" &&
  (p.mentorship_opt_in === true || !!p.booking_url);

interface Props {
  /** Any profile-shaped object with id, profile_type, booking_url, mentorship_* fields. */
  profile: any;
  size?: "sm" | "default";
  variant?: "default" | "outline" | "secondary";
  label?: string;
  className?: string;
}

export const MentorshipButton = ({
  profile, size = "default", variant = "default", label, className,
}: Props) => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);

  if (!isBookableMentor(profile)) return null;
  if (user?.id === profile.id) return null;

  return (
    <>
      <Button
        size={size}
        variant={variant}
        className={cn("gap-2", className)}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen(true);
        }}
      >
        <CalendarClock className={size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4"} />
        {label ?? "Book 1-on-1"}
      </Button>

      <MentorshipRequestModal
        open={open}
        onOpenChange={setOpen}
        mentorId={profile.id}
        mentorName={profile.full_name}
        bookingUrl={profile.booking_url}
        offerings={profile.mentorship_offerings ?? []}
      />
    </>
  );
};
