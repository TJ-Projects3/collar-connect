import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
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
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
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
