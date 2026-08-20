import { useState, type KeyboardEvent } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChipsInputProps {
  value: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  suggestions?: string[];
  max?: number;
  className?: string;
}

/** Reusable multi-select chip editor. Type + Enter (or comma) to add, x to remove. */
export const ChipsInput = ({
  value,
  onChange,
  placeholder = "Type and press Enter",
  suggestions = [],
  max = 20,
  className,
}: ChipsInputProps) => {
  const [draft, setDraft] = useState("");

  const add = (raw: string) => {
    const item = raw.trim().replace(/,+$/, "");
    if (!item) return;
    if (value.length >= max) return;
    if (value.some((v) => v.toLowerCase() === item.toLowerCase())) return;
    onChange([...value, item]);
  };

  const remove = (item: string) => onChange(value.filter((v) => v !== item));

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      add(draft);
      setDraft("");
    } else if (e.key === "Backspace" && !draft && value.length) {
      onChange(value.slice(0, -1));
    }
  };

  const openSuggestions = suggestions.filter(
    (s) => !value.some((v) => v.toLowerCase() === s.toLowerCase())
  );

  return (
    <div className={cn("space-y-2", className)}>
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {value.map((item) => (
            <Badge key={item} variant="secondary" className="gap-1 pr-1">
              <span className="break-words">{item}</span>
              <button
                type="button"
                aria-label={`Remove ${item}`}
                onClick={() => remove(item)}
                className="rounded-full p-0.5 hover:bg-background/40"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          onKeyDownCapture={(e) => {
            if (e.key === " ") e.stopPropagation();
          }}
          onBlur={() => {
            if (draft.trim()) {
              add(draft);
              setDraft("");
            }
          }}
          placeholder={placeholder}
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label="Add"
          onClick={() => {
            add(draft);
            setDraft("");
          }}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {openSuggestions.length > 0 && value.length < max && (
        <div className="flex flex-wrap gap-1.5 pt-0.5">
          {openSuggestions.slice(0, 8).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => add(s)}
              className="rounded-full border border-border px-2.5 py-1 text-[11px] text-muted-foreground transition-colors hover:border-primary hover:text-primary"
            >
              + {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
