import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface TagToggleProps {
  options: string[];
  /** Selected values. For single mode pass an array of 0 or 1 item. */
  value: string[];
  onChange: (next: string[]) => void;
  single?: boolean;
  className?: string;
}

/** Pill-style multi-select (or single-select) tag group. */
export const TagToggle = ({ options, value, onChange, single, className }: TagToggleProps) => {
  const toggle = (option: string) => {
    const selected = value.includes(option);
    if (single) {
      onChange(selected ? [] : [option]);
      return;
    }
    onChange(selected ? value.filter((v) => v !== option) : [...value, option]);
  };

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {options.map((option) => {
        const selected = value.includes(option);
        return (
          <button
            key={option}
            type="button"
            aria-pressed={selected}
            onClick={() => toggle(option)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
              selected
                ? "border-primary bg-primary/10 text-primary"
                : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
            )}
          >
            {selected && <Check className="h-3 w-3" aria-hidden="true" />}
            {option}
          </button>
        );
      })}
    </div>
  );
};
