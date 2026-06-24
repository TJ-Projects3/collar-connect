import { useRef, useState } from "react";
import { ThumbsUp, Lightbulb, PartyPopper, HeartHandshake } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ReactionType } from "@/hooks/usePostLikes";

export const REACTIONS: {
  type: ReactionType;
  label: string;
  Icon: React.ComponentType<{ className?: string }>;
  colorClass: string;
}[] = [
  { type: "like", label: "Like", Icon: ThumbsUp, colorClass: "text-primary" },
  { type: "insightful", label: "Insightful", Icon: Lightbulb, colorClass: "text-amber-500" },
  { type: "celebrate", label: "Celebrate", Icon: PartyPopper, colorClass: "text-pink-500" },
  { type: "support", label: "Support", Icon: HeartHandshake, colorClass: "text-emerald-500" },
];

export const reactionMeta = (type: ReactionType | null | undefined) =>
  REACTIONS.find((r) => r.type === type) ?? REACTIONS[0];

interface ReactionPickerProps {
  current: ReactionType | null;
  disabled?: boolean;
  onSelect: (reaction: ReactionType) => void;
  onQuickToggle: () => void; // click button = toggle like (or remove current)
}

export const ReactionPicker = ({ current, disabled, onSelect, onQuickToggle }: ReactionPickerProps) => {
  const [open, setOpen] = useState(false);
  const hideTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = () => {
    if (hideTimeout.current) clearTimeout(hideTimeout.current);
    setOpen(true);
  };
  const scheduleHide = () => {
    if (hideTimeout.current) clearTimeout(hideTimeout.current);
    hideTimeout.current = setTimeout(() => setOpen(false), 200);
  };

  const active = current ? reactionMeta(current) : null;
  const ButtonIcon = active?.Icon ?? ThumbsUp;
  const labelText = active?.label ?? "Like";

  return (
    <div
      className="relative"
      onMouseEnter={show}
      onMouseLeave={scheduleHide}
      onTouchStart={() => {
        longPressTimeout.current = setTimeout(() => setOpen(true), 350);
      }}
      onTouchEnd={() => {
        if (longPressTimeout.current) clearTimeout(longPressTimeout.current);
      }}
    >
      <button
        type="button"
        disabled={disabled}
        onClick={onQuickToggle}
        className={cn(
          "inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors hover:bg-muted/60 disabled:opacity-50",
          active ? active.colorClass : "text-muted-foreground"
        )}
        aria-label={`React: ${labelText}`}
      >
        <ButtonIcon className={cn("h-4 w-4", active && "fill-current")} />
        <span>{labelText}</span>
      </button>

      {open && (
        <div
          className="absolute bottom-full left-1/2 z-50 mb-2 -translate-x-1/2 rounded-full border bg-popover px-2 py-1.5 shadow-lg animate-in fade-in-0 zoom-in-95"
          onMouseEnter={show}
          onMouseLeave={scheduleHide}
        >
          <div className="flex items-center gap-1">
            {REACTIONS.map((r) => {
              const Icon = r.Icon;
              const isActive = current === r.type;
              return (
                <button
                  key={r.type}
                  type="button"
                  onClick={() => {
                    onSelect(r.type);
                    setOpen(false);
                  }}
                  className={cn(
                    "group flex flex-col items-center rounded-full p-1.5 transition-transform hover:-translate-y-1 hover:scale-110",
                    isActive && "bg-muted"
                  )}
                  title={r.label}
                  aria-label={r.label}
                >
                  <Icon className={cn("h-5 w-5", r.colorClass, isActive && "fill-current")} />
                  <span className="sr-only">{r.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
