import { useRef, useState } from "react";
import { Camera, GraduationCap, Briefcase, Users, ArrowLeft } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChipsInput } from "@/components/ChipsInput";
import { ModalActions } from "@/components/layout/ModalActions";
import { useToast } from "@/hooks/use-toast";
import { useUpdateProfile, useUploadAvatar } from "@/hooks/useProfile";
import {
  MONTHS,
  HIRING_FOCUS_SUGGESTIONS,
  TECH_DOMAIN_OPTIONS,
} from "@/lib/profile-options";
import { cn } from "@/lib/utils";

type Role = "student" | "industry" | "recruiter";

const ROLE_CARDS: {
  role: Role;
  title: string;
  description: string;
  icon: typeof GraduationCap;
}[] = [
  {
    role: "student",
    title: "Student / Early Career",
    description: "Build your profile, find internships and mentors.",
    icon: GraduationCap,
  },
  {
    role: "industry",
    title: "Industry Professional / Mentor",
    description: "Share expertise, mentor students, grow your network.",
    icon: Users,
  },
  {
    role: "recruiter",
    title: "Recruiter / Talent Lead",
    description: "Discover student talent and post roles.",
    icon: Briefcase,
  },
];

interface OnboardingModalProps {
  open: boolean;
  onComplete: () => void;
}

const currentYear = new Date().getFullYear();
const GRAD_YEARS = Array.from({ length: 12 }, (_, i) => currentYear - 4 + i);

export const OnboardingModal = ({ open, onComplete }: OnboardingModalProps) => {
  const [step, setStep] = useState<1 | 2>(1);
  const [role, setRole] = useState<Role | null>(null);

  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Shared
  const [fullName, setFullName] = useState("");
  const [headline, setHeadline] = useState("");
  const [location, setLocation] = useState("");
  const [bio, setBio] = useState("");

  // Student
  const [university, setUniversity] = useState("");
  const [major, setMajor] = useState("");
  const [gradMonth, setGradMonth] = useState<string>("");
  const [gradYear, setGradYear] = useState<string>("");

  // Mentor
  const [currentCompany, setCurrentCompany] = useState("");
  const [techDomains, setTechDomains] = useState<string[]>([]);
  const [mentorshipOptIn, setMentorshipOptIn] = useState(true);

  // Recruiter
  const [companyName, setCompanyName] = useState("");
  const [hiringRoles, setHiringRoles] = useState<string[]>([]);

  const { toast } = useToast();
  const updateProfile = useUpdateProfile();
  const uploadAvatar = useUploadAvatar();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image under 5MB",
        variant: "destructive",
      });
      return;
    }
    setAvatarFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setAvatarPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const pickRole = (next: Role) => {
    setRole(next);
    setStep(2);
  };

  const onSubmit = async () => {
    if (!role) return;
    if (!fullName.trim()) {
      toast({
        title: "Name required",
        description: "Please enter your full name to continue.",
        variant: "destructive",
      });
      return;
    }

    try {
      let avatarUrl: string | undefined;
      if (avatarFile) avatarUrl = await uploadAvatar.mutateAsync(avatarFile);

      const updates: Record<string, unknown> = {
        profile_type: role,
        full_name: fullName.trim(),
        job_title: headline.trim() || null,
        location: location.trim() || null,
        bio: bio.trim() || null,
        ...(avatarUrl ? { avatar_url: avatarUrl } : {}),
      };

      if (role === "student") {
        updates.university = university.trim() || null;
        updates.major = major.trim() || null;
        updates.graduation_year = gradYear ? Number(gradYear) : null;
        updates.graduation_month = gradMonth ? Number(gradMonth) : null;
      } else if (role === "industry") {
        updates.current_company = currentCompany.trim() || null;
        updates.industry_company = currentCompany.trim() || null;
        updates.areas_of_expertise = techDomains;
        updates.mentorship_opt_in = mentorshipOptIn;
      } else {
        updates.company_name = companyName.trim() || null;
        updates.hiring_roles = hiringRoles;
      }

      await updateProfile.mutateAsync(updates as never);

      toast({
        title: "Welcome to NextGen Collar!",
        description: "Your profile is set up.",
      });
      onComplete();
    } catch (error) {
      console.error("Failed to complete onboarding:", error);
      toast({
        title: "Error",
        description: "Failed to save your profile. Please try again.",
        variant: "destructive",
      });
    }
  };

  const isSubmitting = updateProfile.isPending || uploadAvatar.isPending;

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent
        className="sm:max-w-[560px] max-h-[90vh] overflow-y-auto"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
        hideCloseButton
      >
        <DialogHeader>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Step {step} of 2
          </p>
          <DialogTitle className="text-2xl font-bold">
            {step === 1 ? "Welcome to NextGen Collar!" : "Tell us about you"}
          </DialogTitle>
          <DialogDescription>
            {step === 1
              ? "First, which best describes you? We'll tailor your profile to match."
              : "A few details so people know who they're connecting with."}
          </DialogDescription>
        </DialogHeader>

        {step === 1 ? (
          <div className="mt-2 grid gap-3">
            {ROLE_CARDS.map(({ role: r, title, description, icon: Icon }) => (
              <button
                key={r}
                type="button"
                onClick={() => pickRole(r)}
                className={cn(
                  "flex items-start gap-3 rounded-xl border p-4 text-left transition-colors hover:border-primary hover:bg-accent/10",
                  role === r ? "border-primary bg-accent/10" : "border-border"
                )}
              >
                <span className="rounded-lg bg-primary/10 p-2 text-primary">
                  <Icon className="h-5 w-5" />
                </span>
                <span className="min-w-0">
                  <span className="block font-semibold">{title}</span>
                  <span className="block text-sm text-muted-foreground">{description}</span>
                </span>
              </button>
            ))}
            <p className="text-xs text-muted-foreground">
              Recruiter accounts are reviewed by our team before talent search unlocks.
            </p>
          </div>
        ) : (
          <div className="mt-2 space-y-5">
            {/* Avatar */}
            <div className="flex flex-col items-center gap-2">
              <button type="button" onClick={() => fileInputRef.current?.click()} className="relative group">
                <Avatar className="h-24 w-24 border-4 border-secondary">
                  <AvatarImage src={avatarPreview || undefined} />
                  <AvatarFallback className="bg-muted text-2xl text-muted-foreground">
                    {fullName?.[0]?.toUpperCase() || "?"}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute inset-0 flex items-center justify-center rounded-full bg-foreground/50 opacity-0 transition-opacity group-hover:opacity-100">
                  <Camera className="h-6 w-6 text-primary-foreground" />
                </div>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              <span className="text-sm text-muted-foreground">Click to upload a profile photo</span>
            </div>

            <div className="space-y-2">
              <Label htmlFor="ob-name">
                Full Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="ob-name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter your full name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ob-headline">Headline</Label>
              <Input
                id="ob-headline"
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                placeholder={
                  role === "student"
                    ? "e.g., CS Student seeking Summer 2027 internships"
                    : role === "recruiter"
                    ? "e.g., Technical Recruiter at Acme"
                    : "e.g., Senior Software Engineer"
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ob-location">Location</Label>
              <Input
                id="ob-location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="City, State"
              />
            </div>

            {role === "student" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="ob-school">School / Bootcamp</Label>
                  <Input
                    id="ob-school"
                    value={university}
                    onChange={(e) => setUniversity(e.target.value)}
                    placeholder="e.g., Georgia State University"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ob-major">Major</Label>
                  <Input
                    id="ob-major"
                    value={major}
                    onChange={(e) => setMajor(e.target.value)}
                    placeholder="e.g., Computer Science"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Expected Graduation</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Select value={gradMonth} onValueChange={setGradMonth}>
                      <SelectTrigger>
                        <SelectValue placeholder="Month" />
                      </SelectTrigger>
                      <SelectContent>
                        {MONTHS.map((m, i) => (
                          <SelectItem key={m} value={String(i + 1)}>
                            {m}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={gradYear} onValueChange={setGradYear}>
                      <SelectTrigger>
                        <SelectValue placeholder="Year" />
                      </SelectTrigger>
                      <SelectContent>
                        {GRAD_YEARS.map((y) => (
                          <SelectItem key={y} value={String(y)}>
                            {y}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </>
            )}

            {role === "industry" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="ob-company">Current Company</Label>
                  <Input
                    id="ob-company"
                    value={currentCompany}
                    onChange={(e) => setCurrentCompany(e.target.value)}
                    placeholder="Where do you work?"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tech Domain</Label>
                  <ChipsInput
                    value={techDomains}
                    onChange={setTechDomains}
                    suggestions={TECH_DOMAIN_OPTIONS}
                    placeholder="e.g., Cloud, Security"
                  />
                </div>
                <div className="flex items-start justify-between gap-4 rounded-lg border border-border p-3">
                  <div>
                    <p className="text-sm font-medium">Open to mentorship</p>
                    <p className="text-xs text-muted-foreground">
                      Let students request guidance from you.
                    </p>
                  </div>
                  <Switch checked={mentorshipOptIn} onCheckedChange={setMentorshipOptIn} />
                </div>
              </>
            )}

            {role === "recruiter" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="ob-hiring-company">Hiring Company</Label>
                  <Input
                    id="ob-hiring-company"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="Company you recruit for"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Roles You Hire For</Label>
                  <ChipsInput
                    value={hiringRoles}
                    onChange={setHiringRoles}
                    suggestions={HIRING_FOCUS_SUGGESTIONS}
                    placeholder="e.g., Internships, New Grad Roles"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Your account will be reviewed before talent search unlocks.
                </p>
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="ob-bio">Short bio</Label>
              <Textarea
                id="ob-bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={3}
                className="resize-none"
                placeholder="Tell people a bit about yourself..."
              />
            </div>

            <ModalActions
              submitLabel="Complete setup"
              pendingLabel="Saving..."
              cancelLabel="Back"
              onCancel={() => setStep(1)}
              onSubmit={onSubmit}
              isPending={isSubmitting}
              disabled={!fullName.trim()}
            />
            <Button
              type="button"
              variant="link"
              size="sm"
              className="w-full sm:hidden"
              onClick={() => setStep(1)}
              disabled={isSubmitting}
            >
              <ArrowLeft className="mr-1 h-3 w-3" /> Change role
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
