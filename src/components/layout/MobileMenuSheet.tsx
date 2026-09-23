import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/ui/user-avatar";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavDestinations, isPathActive } from "./nav-items";

/**
 * Phone-only slide-out menu holding every destination that is not one of the
 * five bottom-bar tabs (Q&A, Talent, Admin, Me, Calendar, Content Hub...).
 */
export const MobileMenuSheet = () => {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { profile, menuPrimary, secondary, adminItems } = useNavDestinations();

  const close = () => setOpen(false);

  const handleSignOut = async () => {
    close();
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({ title: "Error signing out", description: error.message, variant: "destructive" });
    } else {
      navigate("/auth");
    }
  };

  const renderItem = ({ to, label, icon: Icon }: { to: string; label: string; icon: React.ElementType }) => {
    const isActive = isPathActive(pathname, to);
    return (
      <Link
        key={to}
        to={to}
        onClick={close}
        aria-current={isActive ? "page" : undefined}
        className={cn(
          "flex items-center gap-3 rounded-lg px-4 py-3 text-sm transition-colors",
          isActive
            ? "bg-primary/10 font-medium text-primary"
            : "text-muted-foreground hover:bg-muted hover:text-foreground"
        )}
      >
        <Icon className="h-5 w-5 flex-shrink-0" />
        <span className="truncate">{label}</span>
      </Link>
    );
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9 md:hidden" aria-label="Open menu">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[280px] p-0">
        <SheetHeader className="border-b p-4">
          <Link to="/profile" onClick={close} className="flex items-center gap-3">
            <UserAvatar
              className="h-12 w-12"
              fallbackClassName="text-sm"
              src={profile?.avatar_url}
              name={profile?.full_name}
            />
            <div className="min-w-0">
              <SheetTitle className="truncate text-left">{profile?.full_name || "My Profile"}</SheetTitle>
              <p className="text-xs text-muted-foreground">View profile</p>
            </div>
          </Link>
        </SheetHeader>

        <div className="space-y-1 overflow-y-auto p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
          {menuPrimary.map(renderItem)}
          {adminItems.map(renderItem)}
          <div className="my-2 border-t" />
          {secondary.map(renderItem)}
          <div className="my-2 border-t" />
          <button
            type="button"
            onClick={handleSignOut}
            className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <LogOut className="h-5 w-5" />
            Sign Out
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
};
