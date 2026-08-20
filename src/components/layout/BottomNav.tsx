import { Link, useLocation } from "react-router-dom";
import { Home, Users, HelpCircle, MessageSquare, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { useUnreadNotificationCount } from "@/hooks/useNotifications";

interface BottomNavEntry {
  to: string;
  label: string;
  icon: React.ElementType;
}

const ENTRIES: BottomNavEntry[] = [
  { to: "/feed", label: "Home", icon: Home },
  { to: "/my-network", label: "Network", icon: Users },
  { to: "/community", label: "Q&A", icon: HelpCircle },
  { to: "/messages", label: "Messages", icon: MessageSquare },
  { to: "/profile", label: "Profile", icon: User },
];

/**
 * Fixed mobile-only bottom navigation.
 * Rendered once for authenticated routes; pages get bottom padding via the
 * shared layout wrapper so content never sits underneath it.
 */
export const BottomNav = () => {
  const { pathname } = useLocation();
  const { data: unreadCount = 0 } = useUnreadNotificationCount();

  return (
    <nav
      aria-label="Primary"
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80 pb-[env(safe-area-inset-bottom)]"
    >
      <ul className="grid grid-cols-5">
        {ENTRIES.map(({ to, label, icon: Icon }) => {
          const isActive = pathname === to || pathname.startsWith(`${to}/`);
          const showBadge = to === "/messages" && unreadCount > 0;

          return (
            <li key={to} className="min-w-0">
              <Link
                to={to}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "relative flex h-14 flex-col items-center justify-center gap-0.5 transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}
              >
                <span
                  aria-hidden
                  className={cn(
                    "absolute top-0 h-0.5 w-8 rounded-full transition-colors",
                    isActive ? "bg-primary" : "bg-transparent"
                  )}
                />
                <span className="relative">
                  <Icon className={cn("h-5 w-5", isActive && "fill-current/0")} strokeWidth={isActive ? 2.5 : 2} />
                  {showBadge && (
                    <Badge
                      variant="destructive"
                      className="absolute -right-2 -top-1 flex h-4 min-w-[1rem] items-center justify-center p-0 text-[10px] leading-none"
                    >
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </Badge>
                  )}
                </span>
                <span className={cn("truncate text-[10px]", isActive && "font-semibold")}>{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};
