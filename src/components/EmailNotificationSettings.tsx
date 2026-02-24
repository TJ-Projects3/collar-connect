import { useEmailPreferences, useUpdateEmailPreferences } from "@/hooks/useEmailPreferences";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";

export function EmailNotificationSettings() {
  const { data: preferences, isLoading } = useEmailPreferences();
  const updatePreferences = useUpdateEmailPreferences();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Email Notifications</CardTitle>
          <CardDescription>Manage how you receive email notifications</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-4 w-4 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  const handleToggle = (key: string, value: boolean) => {
    updatePreferences.mutate({ [key]: value } as any);
  };

  const handleFrequencyChange = (value: string) => {
    updatePreferences.mutate({ digest_frequency: value } as any);
  };

  if (!preferences) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Email Notifications</CardTitle>
        <CardDescription>
          Choose which notifications you'd like to receive via email
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="email-messages" className="text-base">
                Message Notifications
              </Label>
              <p className="text-sm text-muted-foreground">
                Get notified when someone sends you a message
              </p>
            </div>
            <Switch
              id="email-messages"
              checked={preferences.email_on_message ?? true}
              onCheckedChange={(value) => handleToggle("email_on_message", value)}
              disabled={updatePreferences.isPending}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="email-connection-request" className="text-base">
                Connection Request Notifications
              </Label>
              <p className="text-sm text-muted-foreground">
                Get notified when someone sends you a connection request
              </p>
            </div>
            <Switch
              id="email-connection-request"
              checked={preferences.email_on_connection_request ?? true}
              onCheckedChange={(value) => handleToggle("email_on_connection_request", value)}
              disabled={updatePreferences.isPending}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="email-connection-accepted" className="text-base">
                Connection Accepted Notifications
              </Label>
              <p className="text-sm text-muted-foreground">
                Get notified when someone accepts your connection request
              </p>
            </div>
            <Switch
              id="email-connection-accepted"
              checked={preferences.email_on_connection_accepted ?? true}
              onCheckedChange={(value) => handleToggle("email_on_connection_accepted", value)}
              disabled={updatePreferences.isPending}
            />
          </div>
        </div>

        <div className="border-t pt-4">
          <div className="space-y-2">
            <Label htmlFor="digest-frequency" className="text-base">
              Email Digest
            </Label>
            <p className="text-sm text-muted-foreground mb-3">
              Receive a summary of all your notifications instead of individual emails
            </p>
            <div className="flex items-center gap-4">
              <Switch
                id="digest-enabled"
              checked={preferences.email_digest ?? false}
              onCheckedChange={(value) => handleToggle("email_digest", value)}
              disabled={updatePreferences.isPending}
            />
              {preferences.email_digest && (
                <Select
                  value={preferences.digest_frequency || "daily"}
                  onValueChange={handleFrequencyChange}
                  disabled={updatePreferences.isPending}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
        </div>

        {updatePreferences.isPending && (
          <div className="text-sm text-muted-foreground flex items-center gap-2">
            <Loader2 className="h-3 w-3 animate-spin" />
            Saving preferences...
          </div>
        )}
      </CardContent>
    </Card>
  );
}
