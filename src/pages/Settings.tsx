import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Bell, Lock, User, Eye, Save, FlaskConical, Loader2 } from "lucide-react";
import { EmailNotificationSettings } from "@/components/EmailNotificationSettings";
import { toast } from "sonner";
import { useProfile, useUpdateProfile } from "@/hooks/useProfile";
import { useAuth } from "@/contexts/AuthContext";

const DEV_OWNER_EMAIL = "isaiahosuntuyi@gmail.com";

const Settings = () => {
  const { data: profile } = useProfile();
  const updateProfile = useUpdateProfile();
  const { user } = useAuth();

  const canAccessDevMode = user?.email === DEV_OWNER_EMAIL || profile?.is_admin === true;

  const handleSaveSettings = () => {
    toast.success("Settings saved successfully!");
  };

  const handleToggleRole = async (checked: boolean) => {
    const newRole = checked ? "recruiter" : "student";
    try {
      await updateProfile.mutateAsync({ profile_type: newRole });
      toast.success(`Switched to ${newRole} view`);
    } catch (e: any) {
      toast.error(e?.message || "Failed to switch role");
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
          {/* Developer Mode - temporary */}
          <Card className="border-dashed border-secondary">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FlaskConical className="h-5 w-5 text-secondary" />
                Developer Mode
              </CardTitle>
              <CardDescription>
                Temporary tool for previewing role-specific UI. Toggles your active profile role between student and recruiter.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Recruiter View</Label>
                  <p className="text-sm text-muted-foreground">
                    Current role: <span className="font-medium">{profile?.profile_type || "student"}</span>
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {updateProfile.isPending && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                  <Switch
                    checked={profile?.profile_type === "recruiter"}
                    onCheckedChange={handleToggleRole}
                    disabled={updateProfile.isPending || !profile}
                  />
                </div>
              </div>
            </CardContent>
          </Card>


          {/* Account Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Account Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
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
              <Button variant="outline" className="w-full justify-start">
                Manage Blocked Users
              </Button>
              <Button variant="outline" className="w-full justify-start text-destructive">
                Delete Account
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Settings;
