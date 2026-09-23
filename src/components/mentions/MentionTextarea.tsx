import {
  forwardRef,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type TextareaHTMLAttributes,
} from "react";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import {
  applyDisplayEdit,
  buildMentionToken,
  findActiveMentionQuery,
  mapDisplayIndexToRaw,
  mapRawIndexToDisplay,
  toDisplayText,
} from "@/lib/mentions";
import { useMentionSearch, type MentionCandidate } from "@/hooks/useMentionSearch";

type TextareaProps = Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "value" | "onChange">;

interface MentionTextareaProps extends TextareaProps {
  value: string;
  onValueChange: (value: string) => void;
  /** Where the suggestion list opens relative to the field. */
  menuPlacement?: "top" | "bottom";
}

/** Base shadcn textarea classes, mirrored by the highlight overlay. */
const TEXTAREA_BASE =
  "flex min-h-[80px] w-full rounded-md border px-3 py-2 text-sm";

const initialsOf = (name: string | null) =>
  (name || "U")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

/**
 * Textarea with @mention autocomplete. The value the parent owns keeps the
 * `@[Full Name](uuid)` markers, while the field itself shows a clean, pill
 * styled `@Name` so the UUID never reaches the user.
 */
export const MentionTextarea = forwardRef<HTMLTextAreaElement, MentionTextareaProps>(
  ({ value, onValueChange, onKeyDown, menuPlacement = "top", className, ...rest }, forwardedRef) => {
    const innerRef = useRef<HTMLTextAreaElement | null>(null);
    const overlayRef = useRef<HTMLDivElement | null>(null);
    const [query, setQuery] = useState<string | null>(null);
    const [range, setRange] = useState<{ start: number; end: number } | null>(null);
    const [highlighted, setHighlighted] = useState(0);
    const pendingCaret = useRef<number | null>(null);

    const { display, segments } = useMemo(() => toDisplayText(value), [value]);

    const { data: candidates = [] } = useMentionSearch(query);
    const open = query !== null && candidates.length > 0;

    const setRefs = (el: HTMLTextAreaElement | null) => {
      innerRef.current = el;
      if (typeof forwardedRef === "function") forwardedRef(el);
      else if (forwardedRef) (forwardedRef as React.MutableRefObject<HTMLTextAreaElement | null>).current = el;
    };

    // Restore the caret after the parent re-renders with the new raw value.
    useLayoutEffect(() => {
      const caret = pendingCaret.current;
      if (caret === null) return;
      pendingCaret.current = null;
      const el = innerRef.current;
      if (!el) return;
      const safe = Math.max(0, Math.min(caret, el.value.length));
      el.setSelectionRange(safe, safe);
    }, [display]);

    const syncOverlayScroll = () => {
      const el = innerRef.current;
      const overlay = overlayRef.current;
      if (el && overlay) overlay.scrollTop = el.scrollTop;
    };

    useEffect(syncOverlayScroll, [display]);

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
      const nextDisplay = e.target.value;
      const caret = e.target.selectionStart ?? nextDisplay.length;
      const { raw: nextRaw, rawCaret } = applyDisplayEdit(value, display, nextDisplay);
      onValueChange(nextRaw);

      const nextSegments = toDisplayText(nextRaw);
      pendingCaret.current = mapRawIndexToDisplay(nextSegments.segments, rawCaret);
      syncQuery(nextSegments.display, pendingCaret.current ?? caret);
    };

    const insert = (candidate: MentionCandidate) => {
      if (!range) return;
      const token = buildMentionToken(candidate.full_name || "User", candidate.id);
      const rawStart = mapDisplayIndexToRaw(segments, range.start, "start");
      const rawEnd = Math.max(rawStart, mapDisplayIndexToRaw(segments, range.end, "end"));
      const nextRaw = `${value.slice(0, rawStart)}${token} ${value.slice(rawEnd)}`;
      onValueChange(nextRaw);
      setQuery(null);
      setRange(null);

      const nextSegments = toDisplayText(nextRaw);
      pendingCaret.current = mapRawIndexToDisplay(nextSegments.segments, rawStart + token.length + 1);
      requestAnimationFrame(() => innerRef.current?.focus());
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
        {/* Highlight layer: mirrors the textarea metrics and paints mention pills. */}
        <div
          ref={overlayRef}
          aria-hidden="true"
          className={cn(
            TEXTAREA_BASE,
            className,
            "pointer-events-none absolute inset-0 overflow-hidden whitespace-pre-wrap break-words border-transparent bg-transparent text-foreground",
          )}
        >
          {segments.map((s, i) =>
            s.isMention ? (
              <span
                key={`${s.rawStart}-${i}`}
                className="rounded bg-primary/10 px-0.5 font-medium text-primary"
              >
                {s.text}
              </span>
            ) : (
              <span key={`${s.rawStart}-${i}`}>{s.text}</span>
            ),
          )}
          {"\u200b"}
        </div>

        <Textarea
          {...rest}
          ref={setRefs}
          value={display}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onScroll={(e) => {
            rest.onScroll?.(e);
            syncOverlayScroll();
          }}
          onBlur={(e) => {
            rest.onBlur?.(e);
            window.setTimeout(() => setQuery(null), 120);
          }}
          onClick={(e) => {
            rest.onClick?.(e);
            const el = e.currentTarget;
            syncQuery(el.value, el.selectionStart ?? el.value.length);
          }}
          className={cn(className, "relative bg-transparent text-transparent caret-foreground")}
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
