import { BadgeCheck, Award } from "lucide-react";
import type { Endorsement } from "@/hooks/useEndorsements";

const gold = "hsl(43 96% 50%)";

/** Compact gold pill — used in headers and on project cards. */
export const EndorsementPill = ({ title }: { title: string }) => (
  <span
    className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold shadow-sm"
    style={{ backgroundColor: gold, color: "hsl(30 60% 15%)" }}
    title="Official NextGen endorsement"
  >
    <BadgeCheck className="h-3 w-3" />
    {title}
  </span>
);

/** Full gold endorsement card with the manager's write-up. */
export const EndorsementCard = ({
  endorsement,
  projectTitle,
}: {
  endorsement: Endorsement;
  projectTitle?: string | null;
}) => (
  <div
    className="rounded-xl border p-4 space-y-2"
    style={{
      borderColor: "hsl(43 96% 50% / 0.5)",
      background:
        "linear-gradient(135deg, hsl(43 96% 50% / 0.14), hsl(43 96% 50% / 0.04))",
    }}
  >
    <div className="flex items-start gap-2">
      <Award className="h-5 w-5 flex-shrink-0" style={{ color: gold }} />
      <div className="min-w-0 space-y-1">
        <p className="font-semibold leading-snug break-words">{endorsement.badge_title}</p>
        <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
          Official NextGen endorsement
        </p>
      </div>
    </div>
    {endorsement.description && (
      <p className="text-sm text-muted-foreground break-words">{endorsement.description}</p>
    )}
    {projectTitle && (
      <p className="text-xs text-muted-foreground">
        Recognized for project: <span className="font-medium">{projectTitle}</span>
      </p>
    )}
  </div>
);

/** Section shown on the profile: gold badge cards for every endorsement. */
export const EndorsementsSection = ({
  endorsements,
  projectTitles,
}: {
  endorsements: Endorsement[];
  projectTitles?: Record<string, string>;
}) => {
  if (endorsements.length === 0) return null;

  return (
    <div className="mt-5 space-y-3">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        NextGen Achievements
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {endorsements.map((e) => (
          <EndorsementCard
            key={e.id}
            endorsement={e}
            projectTitle={e.project_id ? projectTitles?.[e.project_id] : null}
          />
        ))}
      </div>
    </div>
  );
};
