import {
  Home,
  Users,
  Briefcase,
  MessageSquare,
  Bell,
  Search,
  BookOpen,
  Calendar,
  Shield,
  HelpCircle,
  Compass,
  Settings as SettingsIcon,
  User,
} from "lucide-react";
import { useProfile } from "@/hooks/useProfile";
import { useAdminRole } from "@/hooks/useAdminRole";
import { canViewTalent } from "@/lib/profile-display";

export interface NavDestination {
  to: string;
  label: string;
  icon: React.ElementType;
}

/** Tabs shown in the mobile bottom bar (fixed five slots). */
export const BOTTOM_NAV: NavDestination[] = [
  { to: "/feed", label: "Home", icon: Home },
  { to: "/my-network", label: "Network", icon: Users },
  { to: "/jobs", label: "Jobs", icon: Briefcase },
  { to: "/messages", label: "Messaging", icon: MessageSquare },
  { to: "/notifications", label: "Alerts", icon: Bell },
];

/**
 * Single source of truth for navigation destinations shared by the desktop top
 * bar, the tablet sidebar, the mobile bottom bar and the hamburger menu.
 */
export const useNavDestinations = () => {
  const { data: profile } = useProfile();
  const { isAdmin } = useAdminRole();
  const showTalent = canViewTalent(profile, isAdmin);

  const primary: NavDestination[] = [
    { to: "/feed", label: "Home", icon: Home },
    { to: "/my-network", label: "My Network", icon: Users },
    { to: "/jobs", label: "Jobs", icon: Briefcase },
    ...(showTalent ? [{ to: "/talent", label: "Talent", icon: Search }] : []),
    { to: "/messages", label: "Messaging", icon: MessageSquare },
    { to: "/community", label: "Q&A", icon: HelpCircle },
  ];

  // Everything that is not one of the five bottom-bar tabs lives in the
  // hamburger menu on phones.
  const bottomPaths = BOTTOM_NAV.map((item) => item.to);
  const menuPrimary = primary.filter((item) => !bottomPaths.includes(item.to));

  const secondary: NavDestination[] = [
    { to: "/profile", label: "Me", icon: User },
    { to: "/calendar", label: "Calendar", icon: Calendar },
    { to: "/career-mapping", label: "Career Mapping", icon: Compass },
    { to: "/content-hub", label: "Content Hub", icon: BookOpen },
    { to: "/settings", label: "Settings & Privacy", icon: SettingsIcon },
  ];

  const adminItems: NavDestination[] = isAdmin
    ? [{ to: "/admin", label: "Admin", icon: Shield }]
    : [];

  return { profile, isAdmin, primary, menuPrimary, secondary, adminItems };
};

export const getInitials = (name: string | null | undefined) => {
  if (!name) return "ME";
  const names = name.trim().split(" ");
  if (names.length >= 2) {
    return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

export const isPathActive = (pathname: string, to: string) =>
  pathname === to || pathname.startsWith(`${to}/`);
