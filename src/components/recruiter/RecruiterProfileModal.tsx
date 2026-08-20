import { useEffect, useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { ChipsInput } from "@/components/ChipsInput";
import { useUpdateProfile } from "@/hooks/useProfile";
import { useToast } from "@/hooks/use-toast";
import { normalizeUrl } from "@/lib/portfolio-validation";

const ROLE_SUGGESTIONS = [
  "Software Engineer Intern", "New Grad SWE", "Data Analyst",
  "Product Manager", "IT Support", "Cybersecurity Analyst",
];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: any;
}

export const RecruiterProfileModal = ({ open, onOpenChange, profile }: Props) => {
  const updateProfile = useUpdateProfile();
  const { toast } = useToast();

  const [companyName, setCompanyName] = useState("");
  const [companyTitle, setCompanyTitle] = useState("");
  const [workEmail, setWorkEmail] = useState("");
  const [website, setWebsite] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [roles, setRoles] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setCompanyName(profile?.company_name ?? "");
    setCompanyTitle(profile?.company_title ?? "");
    setWorkEmail(profile?.company_email ?? "");
    setWebsite(profile?.company_website ?? "");
    setLinkedin(profile?.linkedin_url ?? "");
    setRoles(profile?.hiring_roles ?? []);
    setError(null);
  }, [open, profile]);

  const handleSave = async () => {
    setError(null);
    if (!companyName.trim()) {
      setError("Company name is required.");
      return;
    }
    const email = workEmail.trim();
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
      setError("Enter a valid work email address.");
      return;
    }

    try {
      await updateProfile.mutateAsync({
        company_name: companyName.trim(),
        company_title: companyTitle.trim() || null,
        company_email: email || null,
        company_website: website.trim() ? normalizeUrl(website) : null,
        linkedin_url: linkedin.trim() ? normalizeUrl(linkedin) : null,
        hiring_roles: roles,
      } as any);
      toast({ title: "Recruiter profile updated" });
      onOpenChange(false);
    } catch (e: any) {
      setError(e?.message || "Failed to save your profile.");
    }
  };

  const stopSpace = (e: React.KeyboardEvent) => {
    if (e.key === " ") e.stopPropagation();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Recruiter profile</DialogTitle>
          <DialogDescription>
            These company credentials are used to verify your recruiter account.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="rp-company">Company name</Label>
            <Input
              id="rp-company"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              onKeyDownCapture={stopSpace}
              placeholder="Acme Corp"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="rp-title">Your title</Label>
            <Input
              id="rp-title"
              value={companyTitle}
              onChange={(e) => setCompanyTitle(e.target.value)}
              onKeyDownCapture={stopSpace}
              placeholder="Technical Recruiter"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="rp-email">Official work email</Label>
            <Input
              id="rp-email"
              type="email"
              value={workEmail}
              onChange={(e) => setWorkEmail(e.target.value)}
              onKeyDownCapture={stopSpace}
              placeholder="you@company.com"
            />
            <p className="text-xs text-muted-foreground">
              Only you and the NextGen Collar review team can see this.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="rp-website">Company website</Label>
            <Input
              id="rp-website"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              onKeyDownCapture={stopSpace}
              placeholder="company.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="rp-linkedin">Recruiter LinkedIn</Label>
            <Input
              id="rp-linkedin"
              value={linkedin}
              onChange={(e) => setLinkedin(e.target.value)}
              onKeyDownCapture={stopSpace}
              placeholder="linkedin.com/in/username"
            />
          </div>

          <div className="space-y-2">
            <Label>Active roles hiring for</Label>
            <ChipsInput
              value={roles}
              onChange={setRoles}
              placeholder="Add a role"
              suggestions={ROLE_SUGGESTIONS}
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={updateProfile.isPending}>
            {updateProfile.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save profile
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
