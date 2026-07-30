import { BadgeCheck, Award } from "lucide-react";
import type { Endorsement } from "@/hooks/useEndorsements";

/** Compact gold pill — used in headers and on project cards. */
export const EndorsementPill = ({ title }: { title: string }) => (
  <span
    className="inline-flex items-center gap-1.5 rounded-full bg-achievement text-achievement-foreground px-2.5 py-1 text-[11px] font-semibold leading-none tracking-tight shadow-sm"
    title="Official NextGen endorsement"
  >
    <BadgeCheck className="h-3.5 w-3.5 flex-shrink-0" />
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
  <div className="rounded-xl border border-achievement/50 bg-gradient-to-br from-achievement/15 to-achievement/5 p-4 space-y-2">
    <div className="flex items-start gap-2">
      <Award className="h-5 w-5 flex-shrink-0 text-achievement" />
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
