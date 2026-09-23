import * as React from "react";
import { User } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

const initialsFrom = (name?: string | null) => {
  if (!name || !name.trim()) return "";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }
  return parts[0].substring(0, 2).toUpperCase();
};

interface UserAvatarProps {
  src?: string | null;
  name?: string | null;
  className?: string;
  fallbackClassName?: string;
  /** Milliseconds to wait for the image before falling back. */
  timeoutMs?: number;
}

/**
 * Profile picture with a guaranteed fallback: initials when available,
 * otherwise a generic person icon. Falls back immediately if the image
 * errors, is blocked by a browser extension, or never finishes loading.
 */
export const UserAvatar = ({
  src,
  name,
  className,
  fallbackClassName,
  timeoutMs = 4000,
}: UserAvatarProps) => {
  const [failed, setFailed] = React.useState(false);
  const [loaded, setLoaded] = React.useState(false);

  // Reset state whenever the source changes.
  React.useEffect(() => {
    setFailed(false);
    setLoaded(false);
  }, [src]);

  // If the request hangs (commonly an ad/privacy blocker swallowing it),
  // give up and show the fallback instead of an empty/broken circle.
  React.useEffect(() => {
    if (!src || loaded || failed) return;
    const timer = window.setTimeout(() => setFailed(true), timeoutMs);
    return () => window.clearTimeout(timer);
  }, [src, loaded, failed, timeoutMs]);

  const initials = initialsFrom(name);
  const showImage = Boolean(src) && !failed;

  return (
    <Avatar className={className}>
      {showImage && (
        <AvatarImage
          src={src as string}
          alt={name || "User"}
          onLoadingStatusChange={(status) => {
            if (status === "loaded") setLoaded(true);
            if (status === "error") setFailed(true);
          }}
        />
      )}
      <AvatarFallback className={cn("bg-primary text-primary-foreground text-xs", fallbackClassName)}>
        {initials || <User className="h-[55%] w-[55%]" aria-hidden="true" />}
      </AvatarFallback>
    </Avatar>
  );
};

export default UserAvatar;
