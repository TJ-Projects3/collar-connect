import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
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
  Menu,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { useProfile } from "@/hooks/useProfile";
import { useAdminRole } from "@/hooks/useAdminRole";
import { useUnreadNotificationCount } from "@/hooks/useNotifications";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { SearchDialog } from "@/components/SearchDialog";
import { Badge } from "@/components/ui/badge";

interface NavItemProps {
  to: string;
  icon: React.ElementType;
  label: string;
  isActive?: boolean;
}

const NotificationBell = ({ currentPath }: { currentPath: string }) => {
  const { data: unreadCount = 0 } = useUnreadNotificationCount();

  return (
    <Link
      to="/notifications"
      className={cn(
        "p-2 rounded-lg transition-colors relative",
        currentPath === "/notifications" ? "text-foreground bg-muted" : "text-muted-foreground"
      )}
    >
      <Bell className="h-5 w-5" />
      {unreadCount > 0 && (
        <Badge
          variant="destructive"
          className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
        >
          {unreadCount > 99 ? "99+" : unreadCount}
        </Badge>
      )}
    </Link>
  );
};

const NavItem = ({ to, icon: Icon, label, isActive }: NavItemProps) => (
  <Link
    to={to}
    className={cn(
      "flex flex-col items-center justify-center px-2 md:px-3 py-1 min-w-[60px] md:min-w-[80px] border-b-2 transition-colors hover:text-foreground",
      isActive
        ? "border-foreground text-foreground"
        : "border-transparent text-muted-foreground"
    )}
  >
    <Icon className="h-5 w-5 md:h-6 md:w-6" />
    <span className="text-[10px] md:text-xs mt-1 hidden md:block">{label}</span>
  </Link>
);

interface MobileNavItemProps {
  to: string;
  icon: React.ElementType;
  label: string;
  isActive?: boolean;
  onClick?: () => void;
}

const MobileNavItem = ({ to, icon: Icon, label, isActive, onClick }: MobileNavItemProps) => (
  <Link
    to={to}
    onClick={onClick}
    className={cn(
      "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
      isActive
        ? "bg-primary/10 text-foreground font-medium"
        : "text-muted-foreground hover:bg-muted hover:text-foreground"
    )}
  >
    <Icon className="h-5 w-5" />
    <span className="text-sm">{label}</span>
  </Link>
);

export const Navbar = () => {
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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

  ];

  const getInitials = (name: string | null | undefined) => {
    if (!name) return "ME";
    const names = name.trim().split(" ");
    if (names.length >= 2) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <header className="sticky top-0 z-50 bg-card border-b">
      <div className="container mx-auto px-2 sm:px-4">
        <div className="flex items-center justify-between h-14">
          {/* Left: Logo + Search */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <Link to="/feed" className="flex-shrink-0">
              <img
                src="/ngc-transparent-logo.png"
                alt="NextGen Collar"
                className="h-8 w-8 sm:h-9 sm:w-9 object-contain"
              />
            </Link>
            <div className="hidden sm:block">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search"
                  className="pl-9 w-[160px] lg:w-[280px] h-9 bg-muted/50 border-0 focus-visible:bg-background"
                  onClick={() => setSearchOpen(true)}
                  readOnly
                />
              </div>
            </div>
            {/* Mobile Search Button */}
            <Button
              variant="ghost"
              size="icon"
              className="sm:hidden h-9 w-9"
              onClick={() => setSearchOpen(true)}
            >
              <Search className="h-5 w-5 text-muted-foreground" />
            </Button>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center h-full">
            {navItems.map((item) => (
              <NavItem
                key={item.label}
                to={item.to}
                icon={item.icon}
                label={item.label}
                isActive={currentPath === item.to}
              />
            ))}

            {isAdmin && (
              <NavItem
                to="/admin"
                icon={Shield}
                label="Admin"
                isActive={currentPath === "/admin"}
              />
            )}

            <div className="h-10 w-px bg-border mx-1 hidden lg:block" />

            {/* Profile Dropdown - Desktop */}
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

          {/* Mobile Navigation */}
          <div className="flex md:hidden items-center gap-1">
            {/* Compact nav icons for mobile */}
            <Link
              to="/feed"
              className={cn(
                "p-2 rounded-lg transition-colors",
                currentPath === "/feed" ? "text-foreground bg-muted" : "text-muted-foreground"
              )}
            >
              <Home className="h-5 w-5" />
            </Link>
            <Link
              to="/messages"
              className={cn(
                "p-2 rounded-lg transition-colors",
                currentPath === "/messages" ? "text-foreground bg-muted" : "text-muted-foreground"
              )}
            >
              <MessageSquare className="h-5 w-5" />
            </Link>
            <NotificationBell currentPath={currentPath} />

            {/* Mobile Menu */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[280px] p-0">
                <SheetHeader className="p-4 border-b">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={profile?.avatar_url || undefined} alt={profile?.full_name || "User"} />
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {getInitials(profile?.full_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <SheetTitle className="text-left">{profile?.full_name || "My Profile"}</SheetTitle>
                      <p className="text-xs text-muted-foreground">View profile</p>
                    </div>
                  </div>
                </SheetHeader>
                <div className="p-4 space-y-1">
                  {navItems.map((item) => (
                    <MobileNavItem
                      key={item.label}
                      to={item.to}
                      icon={item.icon}
                      label={item.label}
                      isActive={currentPath === item.to}
                      onClick={closeMobileMenu}
                    />
                  ))}
                  {isAdmin && (
                    <MobileNavItem
                      to="/admin"
                      icon={Shield}
                      label="Admin"
                      isActive={currentPath === "/admin"}
                      onClick={closeMobileMenu}
                    />
                  )}
                  <div className="my-2 border-t" />
                  <MobileNavItem
                    to="/profile"
                    icon={Users}
                    label="View Profile"
                    isActive={currentPath === "/profile"}
                    onClick={closeMobileMenu}
                  />
                  <MobileNavItem
                    to="/calendar"
                    icon={Calendar}
                    label="Calendar"
                    isActive={currentPath === "/calendar"}
                    onClick={closeMobileMenu}
                  />
                  <MobileNavItem
                    to="/content-hub"
                    icon={BookOpen}
                    label="Content Hub"
                    isActive={currentPath === "/content-hub"}
                    onClick={closeMobileMenu}
                  />
                  <MobileNavItem
                    to="/settings"
                    icon={Shield}
                    label="Settings & Privacy"
                    isActive={currentPath === "/settings"}
                    onClick={closeMobileMenu}
                  />
                  <div className="my-2 border-t" />
                  <button
                    onClick={() => {
                      closeMobileMenu();
                      handleSignOut();
                    }}
                    className="flex items-center gap-3 px-4 py-3 rounded-lg w-full text-left text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                  >
                    <span className="text-sm">Sign Out</span>
                  </button>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
        <SearchDialog open={searchOpen} onOpenChange={setSearchOpen} />
      </div>
    </header>
  );
};
