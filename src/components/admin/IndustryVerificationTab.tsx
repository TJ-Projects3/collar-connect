import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import { Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

interface IndustryProfile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  industry_role_title: string | null;
  industry_company: string | null;
  industry_verified: boolean;
}

interface RecruiterProfile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  company_name: string | null;
  company_title: string | null;
  company_email: string | null;
  company_website: string | null;
  recruiter_status: string | null;
}

interface CompanyRow {

  id: string;
  owner_id: string;
  name: string;
  logo_url: string | null;
  industry: string | null;
  is_verified: boolean;
}

export const IndustryVerificationTab = () => {
  const queryClient = useQueryClient();

  const { data: profiles = [], isLoading } = useQuery({
    queryKey: ["admin-industry-profiles"],
    queryFn: async (): Promise<IndustryProfile[]> => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url, industry_role_title, industry_company, industry_verified")
        .eq("profile_type", "industry")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as IndustryProfile[];
    },
  });

  const { data: companies = [] } = useQuery({
    queryKey: ["admin-companies"],
    queryFn: async (): Promise<CompanyRow[]> => {
      const { data, error } = await supabase
        .from("companies")
        .select("id, owner_id, name, logo_url, industry, is_verified")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as CompanyRow[];
    },
  });

  const verifyProfile = useMutation({
    mutationFn: async ({ id, verified }: { id: string; verified: boolean }) => {
      const { error } = await supabase
        .from("profiles")
        .update({ industry_verified: verified } as never)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-industry-profiles"] });
      toast.success("Industry verification updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const verifyCompany = useMutation({
    mutationFn: async ({ id, verified }: { id: string; verified: boolean }) => {
      const { error } = await supabase
        .from("companies")
        .update({ is_verified: verified } as never)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-companies"] });
      toast.success("Company verification updated");
    },
  });

  const { data: recruiters = [] } = useQuery({
    queryKey: ["admin-recruiter-profiles"],
    queryFn: async (): Promise<RecruiterProfile[]> => {
      const { data, error } = await supabase
        .from("profiles")
        .select(
          "id, full_name, avatar_url, company_name, company_title, company_email, company_website, recruiter_status"
        )
        .eq("profile_type", "recruiter")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as RecruiterProfile[];
    },
  });

  const setRecruiterStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: "approved" | "rejected" }) => {
      const { error } = await supabase
        .from("profiles")
        .update({ recruiter_status: status } as never)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-recruiter-profiles"] });
      toast.success("Recruiter status updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });


  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            Recruiter accounts
          </CardTitle>
          <CardDescription>
            Pending recruiters cannot search candidates, send direct messages, or post until
            approved.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {recruiters.length === 0 && (
            <p className="text-sm text-muted-foreground">No recruiter accounts yet.</p>
          )}
          {recruiters.map((r) => (
            <div
              key={r.id}
              className="flex flex-col gap-3 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex min-w-0 items-center gap-3">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={r.avatar_url ?? undefined} alt={r.full_name ?? "Recruiter"} />
                  <AvatarFallback>{(r.full_name ?? "?").charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="truncate font-medium">{r.full_name ?? "Unnamed recruiter"}</p>
                  <p className="truncate text-sm text-muted-foreground">
                    {[r.company_title, r.company_name].filter(Boolean).join(" @ ") ||
                      "No company details"}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {[r.company_email, r.company_website].filter(Boolean).join(" · ")}
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Badge
                  variant={
                    r.recruiter_status === "approved"
                      ? "secondary"
                      : r.recruiter_status === "rejected"
                        ? "destructive"
                        : "outline"
                  }
                >
                  {r.recruiter_status ?? "pending"}
                </Badge>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={setRecruiterStatus.isPending || r.recruiter_status === "approved"}
                  onClick={() => setRecruiterStatus.mutate({ id: r.id, status: "approved" })}
                >
                  Approve
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-destructive"
                  disabled={setRecruiterStatus.isPending || r.recruiter_status === "rejected"}
                  onClick={() => setRecruiterStatus.mutate({ id: r.id, status: "rejected" })}
                >
                  Reject
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>


      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-secondary" />
            Industry accounts
          </CardTitle>
          <CardDescription>
            Verified industry accounts can access opted-in candidates in Talent, with daily view and
            intro caps.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {isLoading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
          {!isLoading && profiles.length === 0 && (
            <p className="text-sm text-muted-foreground">No industry accounts yet.</p>
          )}
          {profiles.map((p) => (
            <div
              key={p.id}
              className="flex items-center justify-between gap-4 rounded-lg border p-3"
            >
              <div className="flex min-w-0 items-center gap-3">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={p.avatar_url ?? undefined} alt={p.full_name ?? "Member"} />
                  <AvatarFallback>{(p.full_name ?? "?").charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="truncate font-medium">{p.full_name ?? "Unnamed member"}</p>
                  <p className="truncate text-sm text-muted-foreground">
                    {[p.industry_role_title, p.industry_company].filter(Boolean).join(" · ") ||
                      "No role details"}
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {p.industry_verified && <Badge variant="secondary">Verified</Badge>}
                <Switch
                  checked={p.industry_verified}
                  onCheckedChange={(verified) => verifyProfile.mutate({ id: p.id, verified })}
                  disabled={verifyProfile.isPending}
                />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Company profiles</CardTitle>
          <CardDescription>Verify employer accounts representing a company.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {companies.length === 0 && (
            <p className="text-sm text-muted-foreground">No company profiles yet.</p>
          )}
          {companies.map((c) => (
            <div
              key={c.id}
              className="flex items-center justify-between gap-4 rounded-lg border p-3"
            >
              <div className="flex min-w-0 items-center gap-3">
                <Avatar className="h-9 w-9 rounded-md">
                  <AvatarImage src={c.logo_url ?? undefined} alt={c.name} />
                  <AvatarFallback className="rounded-md">{c.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="truncate font-medium">{c.name}</p>
                  <p className="truncate text-sm text-muted-foreground">
                    {c.industry ?? "No industry set"}
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {c.is_verified && <Badge variant="secondary">Verified</Badge>}
                <Switch
                  checked={c.is_verified}
                  onCheckedChange={(verified) => verifyCompany.mutate({ id: c.id, verified })}
                  disabled={verifyCompany.isPending}
                />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};
