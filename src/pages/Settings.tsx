import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Bell, Lock, User, Eye, Save, FlaskConical, Loader2, UserX, Trash2 } from "lucide-react";
import { useBlockedUsers } from "@/hooks/useBlockedUsers";
import { BlockedUsersDialog } from "@/components/settings/BlockedUsersDialog";
import { DeleteAccountDialog } from "@/components/settings/DeleteAccountDialog";
import { EmailNotificationSettings } from "@/components/EmailNotificationSettings";
import { toast } from "sonner";
import { useProfile, useUpdateProfile } from "@/hooks/useProfile";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AVAILABILITY_OPTIONS } from "@/hooks/useTalentCandidates";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useCompany } from "@/hooks/useCompany";
import { CompanyProfileModal } from "@/components/industry/CompanyProfileModal";


const Settings = () => {
  const { data: profile } = useProfile();
  const updateProfile = useUpdateProfile();
  const { user } = useAuth();

  const { data: isAdmin } = useQuery({
    queryKey: ["is-admin", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("has_role", {
        _user_id: user!.id,
        _role: "admin",
      });
      if (error) throw error;
      return data === true;
    },
  });

  const canAccessDevMode = isAdmin === true;

  const isStudent = (profile?.profile_type ?? "student") === "student";
  const isIndustryAccount = profile?.profile_type === "industry";
  const isRecruiterAccount = profile?.profile_type === "recruiter";

  const [companyModalOpen, setCompanyModalOpen] = useState(false);
  const [blockedUsersOpen, setBlockedUsersOpen] = useState(false);
  const [deleteAccountOpen, setDeleteAccountOpen] = useState(false);
  const { data: blockedUsers } = useBlockedUsers();
  const blockedCount = blockedUsers?.length ?? 0;
  const { data: company } = useCompany();



  const handleSaveSettings = () => {
    toast.success("Settings saved successfully!");
  };

  const handleRoleChange = async (newRole: string) => {
    try {
      await updateProfile.mutateAsync({ profile_type: newRole as any });
      toast.success(`Switched to ${newRole} view`);
    } catch (e: any) {
      toast.error(e?.message || "Failed to switch role");
    }
  };

  const handleIndustryVisibility = async (checked: boolean) => {
    try {
      await updateProfile.mutateAsync({ visible_to_industry: checked } as any);
      toast.success(
        checked ? "You're visible to industry professionals" : "Hidden from industry professionals"
      );
    } catch (e: any) {
      toast.error(e?.message || "Failed to update visibility");
    }
  };

  const handleTextField = async (field: string, value: string) => {
    try {
      await updateProfile.mutateAsync({ [field]: value.trim() || null } as any);
    } catch (e: any) {
      toast.error(e?.message || "Failed to save");
    }
  };

  const handleIndustryField = (
    field: "industry_role_title" | "industry_company",
    value: string
  ) => handleTextField(field, value);

  const handleNumberField = async (field: string, value: string) => {
    const parsed = value.trim() === "" ? null : Number(value);
    if (parsed !== null && Number.isNaN(parsed)) return;
    try {
      await updateProfile.mutateAsync({ [field]: parsed } as any);
    } catch (e: any) {
      toast.error(e?.message || "Failed to save");
    }
  };

  const handleListField = async (field: string, value: string) => {
    const list = value
      .split(",")
      .map((v) => v.trim())
      .filter(Boolean);
    try {
      await updateProfile.mutateAsync({ [field]: list } as any);
    } catch (e: any) {
      toast.error(e?.message || "Failed to save");
    }
  };

  const handleMentorshipOptIn = async (checked: boolean) => {
    try {
      await updateProfile.mutateAsync({ mentorship_opt_in: checked } as any);
      toast.success(checked ? "You're open to mentoring" : "Mentorship turned off");
    } catch (e: any) {
      toast.error(e?.message || "Failed to update");
    }
  };


  const handleAvailabilityChange = async (value: string) => {
    try {
      await updateProfile.mutateAsync({ availability: value } as any);
      toast.success("Availability updated");
    } catch (e: any) {
      toast.error(e?.message || "Failed to update availability");
    }
  };



  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Settings & Privacy</h1>
          <Button onClick={handleSaveSettings} className="gap-2">
            <Save className="h-4 w-4" />
            Save Settings
          </Button>
        </div>
        
        <div className="space-y-6">
          {canAccessDevMode && (
            <Card className="border-dashed border-secondary">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FlaskConical className="h-5 w-5 text-secondary" />
                  Developer Mode
                </CardTitle>
                <CardDescription>
                  Temporary tool for previewing role-specific UI. Switches your active profile role
                  between student, recruiter, and industry.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="space-y-0.5">
                    <Label>Active role</Label>
                    <p className="text-sm text-muted-foreground">
                      Current role:{" "}
                      <span className="font-medium">{profile?.profile_type || "student"}</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {updateProfile.isPending && (
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    )}
                    <Select
                      value={profile?.profile_type || "student"}
                      onValueChange={handleRoleChange}
                      disabled={updateProfile.isPending || !profile}
                    >
                      <SelectTrigger className="w-full sm:w-48">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="student">Student</SelectItem>
                        <SelectItem value="recruiter">Recruiter</SelectItem>
                        <SelectItem value="industry">Industry</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}


          {/* Account Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Account Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isStudent && (
                <>
                  <div className="space-y-2">
                    <Label>Work Availability</Label>
                    <p className="text-sm text-muted-foreground">
                      Let recruiters know what kind of role you're open to.
                    </p>
                    <Select
                      value={(profile as any)?.availability ?? undefined}
                      onValueChange={handleAvailabilityChange}
                      disabled={!profile || updateProfile.isPending}
                    >
                      <SelectTrigger className="sm:max-w-xs">
                        <SelectValue placeholder="Select availability" />
                      </SelectTrigger>
                      <SelectContent>
                        {AVAILABILITY_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between gap-4">
                    <div className="space-y-0.5">
                      <Label>Visible to industry professionals &amp; companies</Label>
                      <p className="text-sm text-muted-foreground">
                        Verified industry accounts can discover your profile and projects. Recruiters
                        always can.
                      </p>
                    </div>
                    <Switch
                      checked={(profile as any)?.visible_to_industry ?? true}
                      onCheckedChange={handleIndustryVisibility}
                      disabled={!profile || updateProfile.isPending}
                    />
                  </div>
                  <Separator />
                </>
              )}

              {isIndustryAccount && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="industry-role">Your role title</Label>
                      <Input
                        id="industry-role"
                        defaultValue={(profile as any)?.industry_role_title ?? ""}
                        onBlur={(e) => handleIndustryField("industry_role_title", e.target.value)}
                        onKeyDownCapture={(e) => {
                          if (e.key === " ") e.stopPropagation();
                        }}
                        placeholder="Senior SRE"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="industry-company">Company</Label>
                      <Input
                        id="industry-company"
                        defaultValue={(profile as any)?.industry_company ?? ""}
                        onBlur={(e) => handleIndustryField("industry_company", e.target.value)}
                        onKeyDownCapture={(e) => {
                          if (e.key === " ") e.stopPropagation();
                        }}
                        placeholder="Cloudflare"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="industry-yoe">Years of experience</Label>
                      <Input
                        id="industry-yoe"
                        type="number"
                        min={0}
                        max={70}
                        defaultValue={(profile as any)?.years_of_experience ?? ""}
                        onBlur={(e) => handleNumberField("years_of_experience", e.target.value)}
                        placeholder="8"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="industry-expertise">Areas of expertise</Label>
                      <Input
                        id="industry-expertise"
                        defaultValue={((profile as any)?.areas_of_expertise ?? []).join(", ")}
                        onBlur={(e) => handleListField("areas_of_expertise", e.target.value)}
                        onKeyDownCapture={(e) => {
                          if (e.key === " ") e.stopPropagation();
                        }}
                        placeholder="Distributed systems, SRE, Go"
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <div className="space-y-0.5">
                      <Label>Open to mentoring students</Label>
                      <p className="text-sm text-muted-foreground">
                        Students can request mentorship from your profile.
                      </p>
                    </div>
                    <Switch
                      checked={(profile as any)?.mentorship_opt_in ?? false}
                      onCheckedChange={handleMentorshipOptIn}
                      disabled={!profile || updateProfile.isPending}
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="space-y-0.5">
                      <Label>Company profile</Label>
                      <p className="text-sm text-muted-foreground">
                        {company
                          ? `${company.name}${company.is_verified ? " · verified" : " · pending verification"}`
                          : "Add a company profile if you represent an employer."}
                      </p>
                    </div>
                    <Button variant="outline" onClick={() => setCompanyModalOpen(true)}>
                      {company ? "Edit company" : "Add company"}
                    </Button>
                  </div>
                  {!(profile as any)?.industry_verified && (
                    <p className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">
                      Talent discovery unlocks once the NextGen Collar team verifies your industry
                      account.
                    </p>
                  )}
                  <Separator />
                </>
              )}

              {isRecruiterAccount && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="recruiter-company">Company name</Label>
                      <Input
                        id="recruiter-company"
                        defaultValue={(profile as any)?.company_name ?? ""}
                        onBlur={(e) => handleTextField("company_name", e.target.value)}
                        onKeyDownCapture={(e) => {
                          if (e.key === " ") e.stopPropagation();
                        }}
                        placeholder="Acme Corp"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="recruiter-title">Your title</Label>
                      <Input
                        id="recruiter-title"
                        defaultValue={(profile as any)?.company_title ?? ""}
                        onBlur={(e) => handleTextField("company_title", e.target.value)}
                        onKeyDownCapture={(e) => {
                          if (e.key === " ") e.stopPropagation();
                        }}
                        placeholder="Senior Technical Recruiter"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="recruiter-email">Work email</Label>
                      <Input
                        id="recruiter-email"
                        type="email"
                        defaultValue={(profile as any)?.company_email ?? ""}
                        onBlur={(e) => handleTextField("company_email", e.target.value)}
                        placeholder="you@company.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="recruiter-website">Company website</Label>
                      <Input
                        id="recruiter-website"
                        type="url"
                        defaultValue={(profile as any)?.company_website ?? ""}
                        onBlur={(e) => handleTextField("company_website", e.target.value)}
                        placeholder="https://company.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="recruiter-linkedin">LinkedIn URL</Label>
                      <Input
                        id="recruiter-linkedin"
                        type="url"
                        defaultValue={(profile as any)?.linkedin_url ?? ""}
                        onBlur={(e) => handleTextField("linkedin_url", e.target.value)}
                        placeholder="https://linkedin.com/in/you"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="recruiter-roles">Roles you're hiring for</Label>
                      <Input
                        id="recruiter-roles"
                        defaultValue={((profile as any)?.hiring_roles ?? []).join(", ")}
                        onBlur={(e) => handleListField("hiring_roles", e.target.value)}
                        onKeyDownCapture={(e) => {
                          if (e.key === " ") e.stopPropagation();
                        }}
                        placeholder="Software Engineer Intern, Data Analyst"
                      />
                    </div>
                  </div>
                  {((profile as any)?.recruiter_status ?? "pending") !== "approved" && (
                    <p className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">
                      Your recruiter account is {(profile as any)?.recruiter_status ?? "pending"}.
                      Candidate search, direct messaging, and posting unlock once approved.
                    </p>
                  )}
                  <Separator />
                </>
              )}

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Profile Visibility</Label>
                  <p className="text-sm text-muted-foreground">
                    Make your profile visible to all members
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
            </CardContent>

          </Card>

          {/* Privacy Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Privacy
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Show Activity Status</Label>
                  <p className="text-sm text-muted-foreground">
                    Let others see when you're active
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Private Messages</Label>
                  <p className="text-sm text-muted-foreground">
                    Only connections can message you
                  </p>
                </div>
                <Switch />
              </div>
            </CardContent>
          </Card>

          {/* Email Notification Settings - Connected to backend */}
          <EmailNotificationSettings />

          {/* In-App Notification Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                In-App Notifications
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Push Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive push notifications
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Post Interactions</Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified when someone likes or comments
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>

          {/* Data & Privacy */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Data & Privacy
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full justify-start">
                Download Your Data
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => setBlockedUsersOpen(true)}
              >
                <UserX className="mr-2 h-4 w-4" />
                Manage Blocked Users
                {blockedCount > 0 && (
                  <span className="ml-auto text-xs text-muted-foreground">{blockedCount}</span>
                )}
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
                onClick={() => setDeleteAccountOpen(true)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Account
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <CompanyProfileModal open={companyModalOpen} onOpenChange={setCompanyModalOpen} />
      <BlockedUsersDialog open={blockedUsersOpen} onOpenChange={setBlockedUsersOpen} />
      <DeleteAccountDialog open={deleteAccountOpen} onOpenChange={setDeleteAccountOpen} />
    </div>
  );
};

export default Settings;
