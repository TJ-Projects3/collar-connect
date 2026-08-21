import { useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Camera, Briefcase, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import { ChipsInput } from "@/components/ChipsInput";
import { TagToggle } from "@/components/TagToggle";
import { ModalActions } from "@/components/layout/ModalActions";
import { useProfile, useUpdateProfile, useUploadAvatar } from "@/hooks/useProfile";
import { useJobs } from "@/hooks/useJobs";
import { useToast } from "@/hooks/use-toast";
import { normalizeUrl, normalizeGithubUrl } from "@/lib/portfolio-validation";
import {
  TARGET_TRACK_OPTIONS,
  TECHNICAL_SKILL_SUGGESTIONS,
  WORK_STATUS_OPTIONS,
  WORK_AUTHORIZATION_OPTIONS,
  MENTORSHIP_OFFERING_OPTIONS,
  SENIORITY_OPTIONS,
  HIRING_FOCUS_SUGGESTIONS,
  WORK_TYPE_OPTIONS,
  MONTHS,
  domainFromEmail,
} from "@/lib/profile-options";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const Section = ({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) => (
  <div className="space-y-4">
    <div>
      <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">{title}</h3>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
    {children}
  </div>
);

export const EditProfileModal = ({ open, onOpenChange }: Props) => {
  const { data: profile } = useProfile() as { data: any };
  const updateProfile = useUpdateProfile();
  const uploadAvatar = useUploadAvatar();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const role: string = profile?.profile_type ?? "student";
  const isStudent = role === "student";
  const isIndustry = role === "industry";
  const isRecruiter = role === "recruiter";

  const { data: jobs = [] } = useJobs();
  const myJobs = isRecruiter ? jobs.filter((j: any) => j.created_by === profile?.id) : [];

  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  // Shared
  const [fullName, setFullName] = useState("");
  const [headline, setHeadline] = useState("");
  const [location, setLocation] = useState("");
  const [bio, setBio] = useState("");
  const [website, setWebsite] = useState("");

  // Student
  const [university, setUniversity] = useState("");
  const [major, setMajor] = useState("");
  const [gradMonth, setGradMonth] = useState<string>("");
  const [gradYear, setGradYear] = useState<string>("");
  const [skills, setSkills] = useState<string[]>([]);
  const [tracks, setTracks] = useState<string[]>([]);
  const [workStatus, setWorkStatus] = useState<string[]>([]);
  const [workAuth, setWorkAuth] = useState<string[]>([]);

  // Industry
  const [company, setCompany] = useState("");
  const [roleTitle, setRoleTitle] = useState("");
  const [years, setYears] = useState("");
  const [expertise, setExpertise] = useState<string[]>([]);
  const [offerings, setOfferings] = useState<string[]>([]);
  const [bookingUrl, setBookingUrl] = useState("");
  const [seniority, setSeniority] = useState<string[]>([]);
  const [mentor, setMentor] = useState(false);
  const [portfolio, setPortfolio] = useState("");
  const [github, setGithub] = useState("");
  const [linkedin, setLinkedin] = useState("");

  // Recruiter
  const [companyName, setCompanyName] = useState("");
  const [companyTitle, setCompanyTitle] = useState("");
  const [workEmail, setWorkEmail] = useState("");
  const [emailDomain, setEmailDomain] = useState("");
  const [companyWebsite, setCompanyWebsite] = useState("");
  const [hiringRoles, setHiringRoles] = useState<string[]>([]);
  const [workTypes, setWorkTypes] = useState<string[]>([]);

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !profile) return;
    setAvatarPreview(profile.avatar_url ?? null);
    setAvatarFile(null);
    setError(null);

    setFullName(profile.full_name ?? "");
    setHeadline(profile.job_title ?? "");
    setLocation(profile.location ?? "");
    setBio(profile.bio ?? "");
    setWebsite(profile.website ?? "");

    setUniversity(profile.university ?? "");
    setMajor(profile.major ?? "");
    setGradMonth(profile.graduation_month ? String(profile.graduation_month) : "");
    setGradYear(profile.graduation_year ? String(profile.graduation_year) : "");
    setSkills(profile.technical_skills ?? []);
    setTracks(profile.target_tracks ?? []);
    setWorkStatus(profile.work_status ?? []);
    setWorkAuth(profile.work_authorization ? [profile.work_authorization] : []);

    setCompany(profile.current_company ?? profile.industry_company ?? "");
    setRoleTitle(profile.current_role ?? profile.industry_role_title ?? "");
    setYears(
      profile.years_of_experience === null || profile.years_of_experience === undefined
        ? ""
        : String(profile.years_of_experience)
    );
    setExpertise(profile.areas_of_expertise ?? []);
    setOfferings(profile.mentorship_offerings ?? []);
    setBookingUrl(profile.booking_url ?? "");
    setSeniority(profile.seniority_level ? [profile.seniority_level] : []);
    setMentor(profile.mentorship_opt_in === true);
    setPortfolio(profile.portfolio_url ?? "");
    setGithub(profile.github_url ?? "");
    setLinkedin(profile.linkedin_url ?? "");

    setCompanyName(profile.company_name ?? "");
    setCompanyTitle(profile.company_title ?? "");
    setWorkEmail(profile.company_email ?? "");
    setEmailDomain(profile.company_email_domain ?? "");
    setCompanyWebsite(profile.company_website ?? "");
    setHiringRoles(profile.hiring_roles ?? []);
    setWorkTypes(profile.hiring_work_types ?? []);
  }, [open, profile]);

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

  const stopSpace = (e: React.KeyboardEvent) => {
    if (e.key === " ") e.stopPropagation();
  };

  const handleSave = async () => {
    setError(null);

    if (!fullName.trim()) {
      setError("Full name is required.");
      return;
    }
    if (headline.length > 140) {
      setError("Headline must be 140 characters or fewer.");
      return;
    }

    const updates: Record<string, unknown> = {
      full_name: fullName.trim(),
      job_title: headline.trim() || null,
      location: location.trim() || null,
      bio: bio.trim() || null,
      website: website.trim() ? normalizeUrl(website) : null,
    };

    if (isStudent) {
      const parsedYear = gradYear.trim() === "" ? null : Number(gradYear);
      if (parsedYear !== null && (Number.isNaN(parsedYear) || parsedYear < 1950 || parsedYear > 2100)) {
        setError("Enter a valid graduation year.");
        return;
      }
      Object.assign(updates, {
        university: university.trim() || null,
        major: major.trim() || null,
        graduation_month: gradMonth ? Number(gradMonth) : null,
        graduation_year: parsedYear,
        technical_skills: skills,
        target_tracks: tracks,
        work_status: workStatus,
        work_authorization: workAuth[0] ?? null,
      });
    }

    if (isIndustry) {
      const parsedYears = years.trim() === "" ? null : Number(years);
      if (parsedYears !== null && (Number.isNaN(parsedYears) || parsedYears < 0 || parsedYears > 60)) {
        setError("Years of experience must be a number between 0 and 60.");
        return;
      }
      Object.assign(updates, {
        current_company: company.trim() || null,
        industry_company: company.trim() || null,
        current_role: roleTitle.trim() || null,
        industry_role_title: roleTitle.trim() || null,
        years_of_experience: parsedYears,
        areas_of_expertise: expertise,
        mentorship_offerings: offerings,
        booking_url: bookingUrl.trim() ? normalizeUrl(bookingUrl) : null,
        seniority_level: seniority[0] ?? null,
        mentorship_opt_in: mentor,
        portfolio_url: portfolio.trim() ? normalizeUrl(portfolio) : null,
        github_url: github.trim() ? normalizeGithubUrl(github) : null,
        linkedin_url: linkedin.trim() ? normalizeUrl(linkedin) : null,
      });
    }

    if (isRecruiter) {
      if (!companyName.trim()) {
        setError("Company name is required.");
        return;
      }
      const email = workEmail.trim();
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
        setError("Enter a valid work email address.");
        return;
      }
      Object.assign(updates, {
        company_name: companyName.trim(),
        company_title: companyTitle.trim() || null,
        company_email: email || null,
        company_email_domain:
          emailDomain.trim().toLowerCase().replace(/^@/, "") || domainFromEmail(email),
        company_website: companyWebsite.trim() ? normalizeUrl(companyWebsite) : null,
        linkedin_url: linkedin.trim() ? normalizeUrl(linkedin) : null,
        hiring_roles: hiringRoles,
        hiring_work_types: workTypes,
      });
    }

    try {
      if (avatarFile) {
        updates.avatar_url = await uploadAvatar.mutateAsync(avatarFile);
      }
      await updateProfile.mutateAsync(updates as any);
      toast({ title: "Profile updated", description: "Your profile has been saved." });
      onOpenChange(false);
      setAvatarFile(null);
    } catch (e: any) {
      setError(e?.message || "Failed to update your profile.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>Edit profile</DialogTitle>
          <DialogDescription>
            {isRecruiter
              ? "Update your details and company hiring information."
              : isIndustry
              ? "Update your details and how you support students."
              : "Update your details, academics, and career goals."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Avatar */}
          <div className="flex flex-col items-center gap-2">
            <button type="button" onClick={() => fileInputRef.current?.click()} className="group relative">
              <Avatar className="h-24 w-24 border-4 border-secondary">
                <AvatarImage src={avatarPreview || undefined} />
                <AvatarFallback className="bg-muted text-2xl text-muted-foreground">
                  {fullName?.[0]?.toUpperCase() || "?"}
                </AvatarFallback>
              </Avatar>
              <div className="absolute inset-0 flex items-center justify-center rounded-full bg-foreground/50 opacity-0 transition-opacity group-hover:opacity-100">
                <Camera className="h-6 w-6 text-background" />
              </div>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
            <span className="text-xs text-muted-foreground">Click to change profile picture</span>
          </div>

          {/* Basics */}
          <Section title="Basics">
            <div className="space-y-2">
              <Label htmlFor="ep-name">
                Full name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="ep-name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                onKeyDownCapture={stopSpace}
                placeholder="Your full name"
                maxLength={100}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ep-headline">Headline</Label>
              <Input
                id="ep-headline"
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                onKeyDownCapture={stopSpace}
                placeholder={
                  isRecruiter
                    ? "Technical Recruiter hiring early-career engineers"
                    : isIndustry
                    ? "Senior Platform Engineer helping new grads break into infra"
                    : "CS student focused on cloud infrastructure"
                }
                maxLength={140}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="ep-location">Location</Label>
                <Input
                  id="ep-location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  onKeyDownCapture={stopSpace}
                  placeholder="City, State"
                  maxLength={100}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ep-website">Website</Label>
                <Input
                  id="ep-website"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  onKeyDownCapture={stopSpace}
                  placeholder="yoursite.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="ep-bio">Bio</Label>
              <Textarea
                id="ep-bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell people about yourself"
                rows={4}
                maxLength={500}
              />
            </div>
          </Section>

          {/* Student */}
          {isStudent && (
            <>
              <Separator />
              <Section title="Academic details">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="ep-university">University / institution</Label>
                    <Input
                      id="ep-university"
                      value={university}
                      onChange={(e) => setUniversity(e.target.value)}
                      onKeyDownCapture={stopSpace}
                      placeholder="Georgia State University"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ep-major">Major / degree</Label>
                    <Input
                      id="ep-major"
                      value={major}
                      onChange={(e) => setMajor(e.target.value)}
                      onKeyDownCapture={stopSpace}
                      placeholder="B.S. Computer Science"
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Expected graduation month</Label>
                    <Select value={gradMonth} onValueChange={setGradMonth}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select month" />
                      </SelectTrigger>
                      <SelectContent>
                        {MONTHS.map((m, i) => (
                          <SelectItem key={m} value={String(i + 1)}>
                            {m}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ep-grad-year">Expected graduation year</Label>
                    <Input
                      id="ep-grad-year"
                      type="number"
                      min={1950}
                      max={2100}
                      value={gradYear}
                      onChange={(e) => setGradYear(e.target.value)}
                      onKeyDownCapture={stopSpace}
                      placeholder="2027"
                    />
                  </div>
                </div>
              </Section>

              <Section title="Technical skills & tools" hint="Languages, frameworks, and tools you work with.">
                <ChipsInput
                  value={skills}
                  onChange={setSkills}
                  placeholder="Add a skill"
                  suggestions={TECHNICAL_SKILL_SUGGESTIONS}
                  max={30}
                />
              </Section>

              <Section title="Career track & target roles" hint="Pulled from the Career Mapping tracks.">
                <ChipsInput
                  value={tracks}
                  onChange={setTracks}
                  placeholder="Add a target track or role"
                  suggestions={TARGET_TRACK_OPTIONS}
                  max={6}
                />
              </Section>

              <Section title="Work status">
                <div className="space-y-3">
                  <Label className="text-xs font-normal text-muted-foreground">Availability</Label>
                  <TagToggle options={WORK_STATUS_OPTIONS} value={workStatus} onChange={setWorkStatus} />
                </div>
                <div className="space-y-3">
                  <Label className="text-xs font-normal text-muted-foreground">Work authorization</Label>
                  <TagToggle
                    options={WORK_AUTHORIZATION_OPTIONS}
                    value={workAuth}
                    onChange={setWorkAuth}
                    single
                  />
                </div>
              </Section>
            </>
          )}

          {/* Industry / mentor */}
          {isIndustry && (
            <>
              <Separator />
              <Section title="Current role">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="ep-company">Current company</Label>
                    <Input
                      id="ep-company"
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                      onKeyDownCapture={stopSpace}
                      placeholder="Acme Corp"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ep-role">Job title</Label>
                    <Input
                      id="ep-role"
                      value={roleTitle}
                      onChange={(e) => setRoleTitle(e.target.value)}
                      onKeyDownCapture={stopSpace}
                      placeholder="Staff Software Engineer"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ep-years">Years of experience</Label>
                  <Input
                    id="ep-years"
                    type="number"
                    min={0}
                    max={60}
                    value={years}
                    onChange={(e) => setYears(e.target.value)}
                    onKeyDownCapture={stopSpace}
                    placeholder="8"
                  />
                </div>

                <div className="space-y-3">
                  <Label className="text-xs font-normal text-muted-foreground">Experience level</Label>
                  <TagToggle options={SENIORITY_OPTIONS} value={seniority} onChange={setSeniority} single />
                </div>
              </Section>

              <Section title="Mentorship">
                <div className="flex items-center justify-between rounded-lg border border-border p-3">
                  <div className="pr-3">
                    <Label htmlFor="ep-mentor">Willing to mentor students</Label>
                    <p className="text-xs text-muted-foreground">
                      Shows a mentor badge on your profile so students can reach out.
                    </p>
                  </div>
                  <Switch id="ep-mentor" checked={mentor} onCheckedChange={setMentor} />
                </div>

                <div className="space-y-3">
                  <Label className="text-xs font-normal text-muted-foreground">
                    Mentorship offerings
                  </Label>
                  <TagToggle
                    options={MENTORSHIP_OFFERING_OPTIONS}
                    value={offerings}
                    onChange={setOfferings}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ep-booking">1-on-1 scheduling link</Label>
                  <Input
                    id="ep-booking"
                    value={bookingUrl}
                    onChange={(e) => setBookingUrl(e.target.value)}
                    onKeyDownCapture={stopSpace}
                    placeholder="calendly.com/your-name"
                  />
                </div>
              </Section>

              <Section title="Expertise & links">
                <ChipsInput
                  value={expertise}
                  onChange={setExpertise}
                  placeholder="Add an area of expertise"
                  suggestions={TECHNICAL_SKILL_SUGGESTIONS}
                />
                <div className="space-y-2">
                  <Label htmlFor="ep-portfolio">Portfolio</Label>
                  <Input
                    id="ep-portfolio"
                    value={portfolio}
                    onChange={(e) => setPortfolio(e.target.value)}
                    onKeyDownCapture={stopSpace}
                    placeholder="yoursite.com"
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="ep-github">GitHub</Label>
                    <Input
                      id="ep-github"
                      value={github}
                      onChange={(e) => setGithub(e.target.value)}
                      onKeyDownCapture={stopSpace}
                      placeholder="github.com/username"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ep-linkedin">LinkedIn</Label>
                    <Input
                      id="ep-linkedin"
                      value={linkedin}
                      onChange={(e) => setLinkedin(e.target.value)}
                      onKeyDownCapture={stopSpace}
                      placeholder="linkedin.com/in/username"
                    />
                  </div>
                </div>
              </Section>
            </>
          )}

          {/* Recruiter */}
          {isRecruiter && (
            <>
              <Separator />
              <Section title="Company details" hint="Used to verify your recruiter account.">
                <div className="space-y-2">
                  <Label htmlFor="ep-company-name">
                    Company name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="ep-company-name"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    onKeyDownCapture={stopSpace}
                    placeholder="Acme Corp"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ep-company-title">Your title</Label>
                  <Input
                    id="ep-company-title"
                    value={companyTitle}
                    onChange={(e) => setCompanyTitle(e.target.value)}
                    onKeyDownCapture={stopSpace}
                    placeholder="Technical Recruiter"
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="ep-work-email">Official work email</Label>
                    <Input
                      id="ep-work-email"
                      type="email"
                      value={workEmail}
                      onChange={(e) => setWorkEmail(e.target.value)}
                      onKeyDownCapture={stopSpace}
                      placeholder="you@company.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ep-email-domain">Work email domain</Label>
                    <Input
                      id="ep-email-domain"
                      value={emailDomain}
                      onChange={(e) => setEmailDomain(e.target.value)}
                      onKeyDownCapture={stopSpace}
                      placeholder="company.com"
                    />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Only you and the NextGen Collar review team can see your work email.
                </p>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="ep-company-site">Company website</Label>
                    <Input
                      id="ep-company-site"
                      value={companyWebsite}
                      onChange={(e) => setCompanyWebsite(e.target.value)}
                      onKeyDownCapture={stopSpace}
                      placeholder="company.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ep-recruiter-linkedin">Recruiter LinkedIn</Label>
                    <Input
                      id="ep-recruiter-linkedin"
                      value={linkedin}
                      onChange={(e) => setLinkedin(e.target.value)}
                      onKeyDownCapture={stopSpace}
                      placeholder="linkedin.com/in/username"
                    />
                  </div>
                </div>
              </Section>

              <Section title="Hiring focus">
                <ChipsInput
                  value={hiringRoles}
                  onChange={setHiringRoles}
                  placeholder="Add a role you hire for"
                  suggestions={HIRING_FOCUS_SUGGESTIONS}
                />
                <div className="space-y-3">
                  <Label className="text-xs font-normal text-muted-foreground">Work types</Label>
                  <TagToggle options={WORK_TYPE_OPTIONS} value={workTypes} onChange={setWorkTypes} />
                </div>
              </Section>

              <Section title="Company job listings" hint="Your active postings on the NextGen Jobs board.">
                {myJobs.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No active listings yet.
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {myJobs.slice(0, 5).map((job: any) => (
                      <li key={job.id} className="flex items-start gap-2 text-sm">
                        <Briefcase className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                        <div className="min-w-0">
                          <p className="font-medium break-words">{job.title}</p>
                          <p className="text-xs text-muted-foreground break-words">
                            {[job.company, job.location].filter(Boolean).join(" · ")}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
                <Button variant="outline" size="sm" className="gap-2" asChild>
                  <Link to="/jobs" onClick={() => onOpenChange(false)}>
                    <ExternalLink className="h-4 w-4" />
                    Go to the Jobs board
                  </Link>
                </Button>
              </Section>
            </>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <DialogFooter>
          <ModalActions
            submitLabel="Save profile"
            pendingLabel="Saving..."
            onSubmit={handleSave}
            onCancel={() => onOpenChange(false)}
            isPending={updateProfile.isPending || uploadAvatar.isPending}
            className="w-full"
          />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
