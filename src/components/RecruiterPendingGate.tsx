import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, ShieldAlert, RefreshCw, Settings as SettingsIcon, LogOut, Loader2 } from "lucide-react";
import { useProfile } from "@/hooks/useProfile";
import { useAdminRole } from "@/hooks/useAdminRole";
import { isRecruiterRestricted, recruiterStatus } from "@/lib/profile-display";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const SUPPORT_EMAIL = "support@nextgencollar.com";

/** Routes a pending recruiter may still reach so they can fix their details. */
const ALLOWED_PATHS = ["/settings"];

const DetailRow = ({ label, value }: { label: string; value?: string | null }) => (
  <div className="flex flex-col gap-0.5 sm:flex-row sm:justify-between sm:gap-4">
    <span className="text-sm text-muted-foreground">{label}</span>
    <span className="text-sm font-medium [overflow-wrap:anywhere] sm:text-right">
      {value?.trim() ? value : "—"}
    </span>
  </div>
);

interface RecruiterPendingGateProps {
  children: React.ReactNode;
}

export const RecruiterPendingGate = ({ children }: RecruiterPendingGateProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: profile, isLoading, isFetching, refetch } = useProfile();
  const { isAdmin, isLoading: adminLoading } = useAdminRole();

  const allowed = ALLOWED_PATHS.some((p) => window.location.pathname.startsWith(p));

  if (!user || isLoading || adminLoading) return <>{children}</>;
  if (allowed) return <>{children}</>;
  if (!isRecruiterRestricted(profile, isAdmin)) return <>{children}</>;

  const status = recruiterStatus(profile);
  const rejected = status === "rejected";

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth", { replace: true });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4 py-10">
      <Card className="w-full max-w-lg shadow-lg">
        <CardHeader className="space-y-3 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            {rejected ? (
              <ShieldAlert className="h-6 w-6 text-destructive" />
            ) : (
              <Clock className="h-6 w-6 text-primary" />
            )}
          </div>
          <CardTitle className="text-2xl">
            {rejected ? "Recruiter account not approved" : "Pending admin approval"}
          </CardTitle>
          <div className="flex justify-center">
            <Badge variant={rejected ? "destructive" : "secondary"}>
              {rejected ? "Not approved" : "Under verification"}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            {rejected ? (
              <>
                After review, your recruiter account
                {profile?.company_name ? ` for ${profile.company_name}` : ""} wasn't approved.
                Email{" "}
                <a href={`mailto:${SUPPORT_EMAIL}`} className="text-primary hover:underline">
                  {SUPPORT_EMAIL}
                </a>{" "}
                if you think this is a mistake or you'd like to resubmit updated company details.
              </>
            ) : (
              <>
                Thanks for signing up{profile?.company_name ? ` on behalf of ${profile.company_name}` : ""}.
                Ms. Tia is verifying your company credentials. Candidate search, direct messaging,
                and posting unlock as soon as you're approved — we'll email you the moment that
                happens.
              </>
            )}
          </p>
        </CardHeader>

        <CardContent className="space-y-5">
          <div className="space-y-2 rounded-lg border bg-background p-4">
            <p className="text-sm font-semibold">What you submitted</p>
            <DetailRow label="Name" value={profile?.full_name} />
            <DetailRow label="Company" value={profile?.company_name} />
            <DetailRow label="Your title" value={profile?.company_title} />
            <DetailRow label="Work email" value={profile?.company_email} />
            <DetailRow label="Company website" value={profile?.company_website} />
            <DetailRow label="LinkedIn" value={profile?.linkedin_url} />
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <Button className="flex-1" onClick={() => navigate("/settings")}>
              <SettingsIcon className="mr-2 h-4 w-4" />
              Edit my details
            </Button>
            <Button variant="outline" className="flex-1" onClick={() => refetch()} disabled={isFetching}>
              {isFetching ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              Refresh status
            </Button>
          </div>

          <Button variant="ghost" className="w-full" onClick={handleSignOut}>
            <LogOut className="mr-2 h-4 w-4" />
            Sign out
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
