import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { GraduationCap } from "lucide-react";
import { useTopMentors } from "@/hooks/useTopMentors";
import { RoleBadge } from "@/components/RoleBadge";
import { MentorshipButton } from "@/components/mentorship/MentorshipButton";
import { getIndustryHeadline } from "@/lib/profile-display";

const initialsOf = (name?: string | null) =>
  (name || "U").split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();

export const TopMentorsCard = ({ limit = 5 }: { limit?: number }) => {
  const { data: mentors = [], isLoading } = useTopMentors(limit);

  if (!isLoading && mentors.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <GraduationCap className="h-5 w-5 text-secondary" />
          <h3 className="font-semibold">Top Mentors</h3>
        </div>
        <p className="text-xs text-muted-foreground">
          Industry pros open to mentoring students.
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading && (
          <>
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </>
        )}

        {mentors.map((m) => {
          const subline = getIndustryHeadline(m) || m.job_title || "Industry professional";
          return (
            <div key={m.id} className="flex items-start gap-3">
              <Link to={`/profile?userId=${m.id}`} className="shrink-0">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={m.avatar_url ?? undefined} alt={m.full_name ?? "Mentor"} />
                  <AvatarFallback className="text-xs">{initialsOf(m.full_name)}</AvatarFallback>
                </Avatar>
              </Link>
              <div className="min-w-0 flex-1 space-y-1">
                <Link
                  to={`/profile?userId=${m.id}`}
                  className="block truncate text-sm font-medium hover:underline"
                >
                  {m.full_name ?? "Member"}
                </Link>
                <p className="truncate text-xs text-muted-foreground">{subline}</p>
                <div className="flex flex-wrap items-center gap-1.5">
                  <RoleBadge profile={m} compact />
                  {m.answer_count > 0 && (
                    <span className="text-[10px] text-muted-foreground">
                      {m.answer_count} {m.answer_count === 1 ? "answer" : "answers"}
                    </span>
                  )}
                </div>
                <MentorshipButton
                  profile={m}
                  size="sm"
                  variant="outline"
                  label="Book 1-on-1"
                  className="mt-1 h-7 text-xs"
                />
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};
