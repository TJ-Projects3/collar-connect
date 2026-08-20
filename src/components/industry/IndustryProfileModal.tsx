import { useEffect, useState } from "react";
import { ModalActions } from "@/components/layout/ModalActions";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Loader2 } from "lucide-react";
import { ChipsInput } from "@/components/ChipsInput";
import { useUpdateProfile } from "@/hooks/useProfile";
import { useToast } from "@/hooks/use-toast";
import { normalizeUrl, normalizeGithubUrl } from "@/lib/portfolio-validation";

const EXPERTISE_SUGGESTIONS = [
  "Software Engineering", "Product Management", "Data Science", "Cybersecurity",
  "Cloud / DevOps", "UX Design", "Machine Learning", "Engineering Leadership",
];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: any;
}

export const IndustryProfileModal = ({ open, onOpenChange, profile }: Props) => {
  const updateProfile = useUpdateProfile();
  const { toast } = useToast();

  const [headline, setHeadline] = useState("");
  const [company, setCompany] = useState("");
  const [roleTitle, setRoleTitle] = useState("");
  const [years, setYears] = useState("");
  const [expertise, setExpertise] = useState<string[]>([]);
  const [portfolio, setPortfolio] = useState("");
  const [github, setGithub] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [mentor, setMentor] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setHeadline(profile?.job_title ?? "");
    setCompany(profile?.current_company ?? profile?.industry_company ?? "");
    setRoleTitle(profile?.current_role ?? profile?.industry_role_title ?? "");
    setYears(
      profile?.years_of_experience === null || profile?.years_of_experience === undefined
        ? ""
        : String(profile.years_of_experience)
    );
    setExpertise(profile?.areas_of_expertise ?? []);
    setPortfolio(profile?.portfolio_url ?? "");
    setGithub(profile?.github_url ?? "");
    setLinkedin(profile?.linkedin_url ?? "");
    setMentor(profile?.mentorship_opt_in === true);
    setError(null);
  }, [open, profile]);

  const handleSave = async () => {
    setError(null);
    const parsedYears = years.trim() === "" ? null : Number(years);
    if (parsedYears !== null && (Number.isNaN(parsedYears) || parsedYears < 0 || parsedYears > 60)) {
      setError("Years of experience must be a number between 0 and 60.");
      return;
    }
    if (headline.length > 140) {
      setError("Headline must be 140 characters or fewer.");
      return;
    }

    try {
      await updateProfile.mutateAsync({
        job_title: headline.trim() || null,
        current_company: company.trim() || null,
        industry_company: company.trim() || null,
        current_role: roleTitle.trim() || null,
        industry_role_title: roleTitle.trim() || null,
        years_of_experience: parsedYears,
        areas_of_expertise: expertise,
        portfolio_url: portfolio.trim() ? normalizeUrl(portfolio) : null,
        github_url: github.trim() ? normalizeGithubUrl(github) : null,
        linkedin_url: linkedin.trim() ? normalizeUrl(linkedin) : null,
        mentorship_opt_in: mentor,
      } as any);
      toast({ title: "Industry profile updated" });
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
          <DialogTitle>Industry professional profile</DialogTitle>
          <DialogDescription>
            Tell students who you are, what you work on, and whether you're open to mentoring.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="ip-headline">Headline</Label>
            <Input
              id="ip-headline"
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              onKeyDownCapture={stopSpace}
              placeholder="Senior Platform Engineer helping new grads break into infra"
              maxLength={140}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="ip-company">Current company</Label>
              <Input
                id="ip-company"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                onKeyDownCapture={stopSpace}
                placeholder="Acme Corp"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ip-role">Job title</Label>
              <Input
                id="ip-role"
                value={roleTitle}
                onChange={(e) => setRoleTitle(e.target.value)}
                onKeyDownCapture={stopSpace}
                placeholder="Staff Software Engineer"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="ip-years">Years of experience</Label>
            <Input
              id="ip-years"
              type="number"
              min={0}
              max={60}
              value={years}
              onChange={(e) => setYears(e.target.value)}
              onKeyDownCapture={stopSpace}
              placeholder="8"
            />
          </div>

          <div className="space-y-2">
            <Label>Areas of expertise</Label>
            <ChipsInput
              value={expertise}
              onChange={setExpertise}
              placeholder="Add an area of expertise"
              suggestions={EXPERTISE_SUGGESTIONS}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="ip-portfolio">Portfolio / website</Label>
            <Input
              id="ip-portfolio"
              value={portfolio}
              onChange={(e) => setPortfolio(e.target.value)}
              onKeyDownCapture={stopSpace}
              placeholder="yoursite.com"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="ip-github">GitHub</Label>
              <Input
                id="ip-github"
                value={github}
                onChange={(e) => setGithub(e.target.value)}
                onKeyDownCapture={stopSpace}
                placeholder="github.com/username"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ip-linkedin">LinkedIn</Label>
              <Input
                id="ip-linkedin"
                value={linkedin}
                onChange={(e) => setLinkedin(e.target.value)}
                onKeyDownCapture={stopSpace}
                placeholder="linkedin.com/in/username"
              />
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-border p-3">
            <div className="pr-3">
              <Label htmlFor="ip-mentor">Willing to mentor students</Label>
              <p className="text-xs text-muted-foreground">
                Shows a mentor badge on your profile so students can reach out.
              </p>
            </div>
            <Switch id="ip-mentor" checked={mentor} onCheckedChange={setMentor} />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <DialogFooter>
          <ModalActions
            submitLabel="Save profile"
            pendingLabel="Saving..."
            onSubmit={handleSave}
            onCancel={() => onOpenChange(false)}
            isPending={updateProfile.isPending}
            className="w-full"
          />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
