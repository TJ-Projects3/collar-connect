import { forwardRef, useMemo, useRef, useState, type KeyboardEvent, type TextareaHTMLAttributes } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { buildMentionToken, findActiveMentionQuery } from "@/lib/mentions";
import { useMentionSearch, type MentionCandidate } from "@/hooks/useMentionSearch";

type TextareaProps = Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "value" | "onChange">;

interface MentionTextareaProps extends TextareaProps {
  value: string;
  onValueChange: (value: string) => void;
  /** Where the suggestion list opens relative to the field. */
  menuPlacement?: "top" | "bottom";
}

const initialsOf = (name: string | null) =>
  (name || "U")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

/**
 * Textarea with @mention autocomplete. Inserts `@[Full Name](uuid)` markers,
 * which the display layer renders as profile links.
 */
export const MentionTextarea = forwardRef<HTMLTextAreaElement, MentionTextareaProps>(
  ({ value, onValueChange, onKeyDown, menuPlacement = "top", className, ...rest }, forwardedRef) => {
    const innerRef = useRef<HTMLTextAreaElement | null>(null);
    const [query, setQuery] = useState<string | null>(null);
    const [range, setRange] = useState<{ start: number; end: number } | null>(null);
    const [highlighted, setHighlighted] = useState(0);

    const { data: candidates = [] } = useMentionSearch(query);
    const open = query !== null && candidates.length > 0;

    const setRefs = (el: HTMLTextAreaElement | null) => {
      innerRef.current = el;
      if (typeof forwardedRef === "function") forwardedRef(el);
      else if (forwardedRef) (forwardedRef as React.MutableRefObject<HTMLTextAreaElement | null>).current = el;
    };

    const syncQuery = (text: string, caret: number) => {
      const active = findActiveMentionQuery(text, caret);
      if (!active) {
        setQuery(null);
        setRange(null);
        return;
      }
      setQuery(active.query);
      setRange({ start: active.start, end: active.end });
      setHighlighted(0);
    };

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const next = e.target.value;
      onValueChange(next);
      syncQuery(next, e.target.selectionStart ?? next.length);
    };

    const insert = (candidate: MentionCandidate) => {
      if (!range) return;
      const token = buildMentionToken(candidate.full_name || "User", candidate.id);
      const next = `${value.slice(0, range.start)}${token} ${value.slice(range.end)}`;
      onValueChange(next);
      setQuery(null);
      setRange(null);
      const caret = range.start + token.length + 1;
      requestAnimationFrame(() => {
        const el = innerRef.current;
        if (!el) return;
        el.focus();
        el.setSelectionRange(caret, caret);
      });
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (open) {
        if (e.key === "ArrowDown") {
          e.preventDefault();
          setHighlighted((i) => (i + 1) % candidates.length);
          return;
        }
        if (e.key === "ArrowUp") {
          e.preventDefault();
          setHighlighted((i) => (i - 1 + candidates.length) % candidates.length);
          return;
        }
        if (e.key === "Enter" || e.key === "Tab") {
          e.preventDefault();
          insert(candidates[highlighted]);
          return;
        }
        if (e.key === "Escape") {
          e.preventDefault();
          setQuery(null);
          setRange(null);
          return;
        }
      }
      onKeyDown?.(e);
    };

    const firstNonConnection = useMemo(
      () => candidates.findIndex((c) => !c.isConnection),
      [candidates],
    );
    const hasConnections = candidates.some((c) => c.isConnection);

    return (
      <div className="relative">
        <Textarea
          {...rest}
          ref={setRefs}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onBlur={(e) => {
            rest.onBlur?.(e);
            window.setTimeout(() => setQuery(null), 120);
          }}
          onClick={(e) => {
            rest.onClick?.(e);
            const el = e.currentTarget;
            syncQuery(el.value, el.selectionStart ?? el.value.length);
          }}
          className={className}
        />

        {open && (
          <div
            className={cn(
              "absolute left-0 z-50 w-72 max-w-[85vw] overflow-hidden rounded-md border border-border bg-popover shadow-lg",
              menuPlacement === "top" ? "bottom-full mb-1" : "top-full mt-1",
            )}
          >
            <ul className="max-h-64 overflow-y-auto py-1" role="listbox">
              {candidates.map((c, i) => (
                <li key={c.id}>
                  {hasConnections && i === firstNonConnection && firstNonConnection > 0 && (
                    <div className="px-3 py-1 text-[11px] uppercase tracking-wide text-muted-foreground border-t border-border mt-1 pt-2">
                      Others
                    </div>
                  )}
                  <button
                    type="button"
                    role="option"
                    aria-selected={i === highlighted}
                    onMouseDown={(e) => e.preventDefault()}
                    onMouseEnter={() => setHighlighted(i)}
                    onClick={() => insert(c)}
                    className={cn(
                      "flex w-full items-center gap-2 px-3 py-2 text-left",
                      i === highlighted ? "bg-accent" : "hover:bg-muted/60",
                    )}
                  >
                    <Avatar className="h-7 w-7">
                      <AvatarImage src={c.avatar_url || undefined} />
                      <AvatarFallback className="bg-primary text-primary-foreground text-[10px]">
                        {initialsOf(c.full_name)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">{c.full_name}</span>
                      {c.job_title && (
                        <span className="block truncate text-xs text-muted-foreground">{c.job_title}</span>
                      )}
                    </span>
                    {c.isConnection && (
                      <span className="shrink-0 text-[10px] text-primary">Connected</span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  },
);

MentionTextarea.displayName = "MentionTextarea";
