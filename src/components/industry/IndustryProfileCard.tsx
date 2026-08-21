import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Github, Linkedin, Globe, Pencil, Factory, GraduationCap, CalendarClock,
} from "lucide-react";
import { getIndustryHeadline } from "@/lib/profile-display";

interface Props {
  profile: any;
  isOwnProfile: boolean;
  onEdit?: () => void;
}

export const IndustryProfileCard = ({ profile, isOwnProfile, onEdit }: Props) => {
  const expertise: string[] = profile?.areas_of_expertise ?? [];
  const offerings: string[] = profile?.mentorship_offerings ?? [];
  const seniority: string | null = profile?.seniority_level ?? null;
  const bookingUrl: string | null = profile?.booking_url ?? null;
  const headline: string = profile?.job_title ?? "";
  const roleLine = getIndustryHeadline(profile);
  const years = profile?.years_of_experience;
  const links = [
    { label: "Portfolio", url: profile?.portfolio_url, Icon: Globe },
    { label: "GitHub", url: profile?.github_url, Icon: Github },
    { label: "LinkedIn", url: profile?.linkedin_url, Icon: Linkedin },
  ].filter((l) => !!l.url);

  const isEmpty =
    !headline && !roleLine && !expertise.length && !links.length &&
    !offerings.length && !seniority && !bookingUrl &&
    (years === null || years === undefined);

  if (isEmpty && !isOwnProfile) return null;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <h2 className="flex items-center gap-2 text-xl font-bold">
          <Factory className="h-5 w-5 text-secondary" />
          Industry profile
        </h2>
        {isOwnProfile && onEdit && (
          <Button variant="ghost" size="sm" className="gap-2" onClick={onEdit}>
            <Pencil className="h-4 w-4" />
            {isEmpty ? "Complete" : "Edit"}
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {isEmpty ? (
          <p className="text-sm text-muted-foreground">
            Add your company, expertise, and links so students know who you are.
          </p>
        ) : (
          <>
            {headline && <p className="font-medium leading-relaxed break-words">{headline}</p>}

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
              {roleLine && <span className="break-words">{roleLine}</span>}
              {seniority && <span>{seniority}</span>}
              {typeof years === "number" && (
                <span>
                  {years} {years === 1 ? "year" : "years"} of experience
                </span>
              )}
            </div>

            {profile?.mentorship_opt_in === true && (
              <p className="flex items-center gap-2 text-sm font-medium text-secondary">
                <GraduationCap className="h-4 w-4" />
                Open to mentoring students
              </p>
            )}

            {offerings.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Mentorship offerings
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {offerings.map((item) => (
                    <Badge key={item} className="break-words">{item}</Badge>
                  ))}
                </div>
              </div>
            )}

            {expertise.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Areas of expertise
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {expertise.map((item) => (
                    <Badge key={item} variant="secondary" className="break-words">
                      {item}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {(links.length > 0 || bookingUrl) && (
              <div className="flex flex-wrap gap-2 pt-1">
                {bookingUrl && (
                  <Button size="sm" className="gap-2" asChild>
                    <a href={bookingUrl} target="_blank" rel="noopener noreferrer">
                      <CalendarClock className="h-4 w-4" />
                      Book a 1-on-1
                    </a>
                  </Button>
                )}
                {links.map(({ label, url, Icon }) => (
                  <Button key={label} variant="outline" size="sm" className="gap-2" asChild>
                    <a href={url} target="_blank" rel="noopener noreferrer">
                      <Icon className="h-4 w-4" />
                      {label}
                    </a>
                  </Button>
                ))}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};
