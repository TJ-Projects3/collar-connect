import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  /** Show a back button. Pass a path to navigate to, or `true` for history back. */
  backTo?: string | true;
  backLabel?: string;
  /** Optional leading icon rendered next to the title. */
  icon?: React.ElementType;
  /** Right-aligned actions (buttons, filters). */
  actions?: React.ReactNode;
  className?: string;
}

/**
 * Shared page header used under the global navbar so every page has the same
 * back-button, title, and action-slot treatment.
 */
export const PageHeader = ({
  title,
  subtitle,
  backTo,
  backLabel = "Back",
  icon: Icon,
  actions,
  className,
}: PageHeaderProps) => {
  const navigate = useNavigate();

  const handleBack = () => {
    if (typeof backTo === "string") navigate(backTo);
    else navigate(-1);
  };

  return (
    <div className={cn("mb-4 space-y-2", className)}>
      {backTo && (
        <Button variant="ghost" size="sm" onClick={handleBack} className="-ml-2 gap-1 text-muted-foreground">
          <ArrowLeft className="h-4 w-4" />
          {backLabel}
        </Button>
      )}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="flex items-center gap-2 text-xl font-bold tracking-tight sm:text-2xl">
            {Icon && <Icon className="h-5 w-5 flex-shrink-0 text-primary sm:h-6 sm:w-6" />}
            <span className="truncate">{title}</span>
          </h1>
          {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
        </div>
        {actions && <div className="flex flex-shrink-0 items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
};
