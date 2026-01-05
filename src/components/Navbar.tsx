import { Link, useLocation, useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Home,
  Users,
  Briefcase,
  MessageSquare,
  Bell,
  Search,
  BookOpen,
  Calendar,
  ChevronDown,
  Shield,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useProfile } from "@/hooks/useProfile";
import { useAdminRole } from "@/hooks/useAdminRole";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface NavItemProps {
  to: string;
  icon: React.ElementType;
  label: string;
  isActive?: boolean;
}

const NavItem = ({ to, icon: Icon, label, isActive }: NavItemProps) => (
  <Link
    to={to}
    className={cn(
      "flex flex-col items-center justify-center px-3 py-1 min-w-[80px] border-b-2 transition-colors hover:text-foreground",
      isActive
        ? "border-foreground text-foreground"
        : "border-transparent text-muted-foreground"
    )}
  >
    <Icon className="h-6 w-6" />
    <span className="text-xs mt-1 hidden md:block">{label}</span>
  </Link>
);

export const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const currentPath = location.pathname;
  const { data: profile } = useProfile();
  const { isAdmin } = useAdminRole();

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: "Error signing out",
        description: error.message,
        variant: "destructive",
      });
    } else {
      navigate("/auth");
    }
  };

  const navItems = [
    { to: "/feed", icon: Home, label: "Home" },
    { to: "/my-network", icon: Users, label: "My Network" },
    { to: "/jobs", icon: Briefcase, label: "Jobs" },
    { to: "/messages", icon: MessageSquare, label: "Messaging" },
    { to: "#", icon: Bell, label: "Notifications" },
  ];

  // Get initials from full name for avatar fallback
  const getInitials = (name: string | null | undefined) => {
    if (!name) return "ME";
    const names = name.trim().split(" ");
    if (names.length >= 2) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <header className="sticky top-0 z-50 bg-card border-b">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          {/* Left: Logo + Search */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <Link to="/feed" className="flex-shrink-0">
              <img
                src="/ngc-transparent-logo.png"
                alt="NextGen Collar"
                className="h-9 w-9 object-contain"
              />
            </Link>
            <div className="hidden sm:block">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search"
                  className="pl-9 w-[200px] lg:w-[280px] h-9 bg-muted/50 border-0 focus-visible:bg-background"
                />
              </div>
            </div>
          </div>

          {/* Center/Right: Navigation Items */}
          <nav className="flex items-center h-full">
            {navItems.map((item) => (
              <NavItem
                key={item.label}
                to={item.to}
                icon={item.icon}
                label={item.label}
                isActive={currentPath === item.to}
              />
            ))}

            {/* Admin Nav Item - Only for admin users */}
            {isAdmin && (
              <NavItem
                to="/admin"
                icon={Shield}
                label="Admin"
                isActive={currentPath === "/admin"}
              />
            )}

            {/* Divider */}
            <div className="h-10 w-px bg-border mx-1 hidden lg:block" />

            {/* Profile Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex flex-col items-center justify-center px-3 py-1 min-w-[80px] border-b-2 border-transparent text-muted-foreground hover:text-foreground transition-colors">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={profile?.avatar_url || undefined} alt={profile?.full_name || "User"} />
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                      {getInitials(profile?.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-xs mt-1 hidden md:flex items-center gap-0.5">
                    Me
                    <ChevronDown className="h-3 w-3" />
                  </span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="flex items-center gap-3 p-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={profile?.avatar_url || undefined} alt={profile?.full_name || "User"} />
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {getInitials(profile?.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold text-sm">{profile?.full_name || "My Profile"}</p>
                    <p className="text-xs text-muted-foreground">View profile</p>
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/profile" className="cursor-pointer">
                    View Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/calendar" className="cursor-pointer">
                    <Calendar className="h-4 w-4 mr-2" />
                    Calendar
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/content-hub" className="cursor-pointer">
                    <BookOpen className="h-4 w-4 mr-2" />
                    Content Hub
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/settings" className="cursor-pointer">
                    Settings & Privacy
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer text-muted-foreground" onClick={handleSignOut}>
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </nav>
        </div>
      </div>
    </header>
  );
};
