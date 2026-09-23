/**
 * Mentions are stored inline as `@[Full Name](user-uuid)` so the raw text stays
 * readable while the display layer can turn each marker into a profile link.
 */
export const MENTION_REGEX = /@\[([^\]]+)\]\(([0-9a-fA-F-]{36})\)/g;

export const buildMentionToken = (fullName: string, userId: string) =>
  `@[${(fullName || "User").replace(/[[\]()]/g, "")}](${userId})`;

/** UUIDs tagged inside a piece of content. */
export const extractMentionIds = (content: string): string[] => {
  const ids = new Set<string>();
  for (const m of content.matchAll(MENTION_REGEX)) ids.add(m[2]);
  return Array.from(ids);
};

/** Human-readable version of the text, used for previews and notifications. */
export const stripMentionMarkup = (content: string): string =>
  content.replace(MENTION_REGEX, (_all, name) => `@${name}`);

export interface MentionSegment {
  isMention: boolean;
  /** Display label for mentions (`@Name`), literal text otherwise. */
  text: string;
  userId?: string;
  rawStart: number;
  rawEnd: number;
  displayStart: number;
  displayEnd: number;
}

/**
 * Splits raw content into literal/mention segments and builds the display text
 * shown inside input fields (`@[Name](uuid)` becomes `@Name`).
 */
export const toDisplayText = (raw: string): { display: string; segments: MentionSegment[] } => {
  const segments: MentionSegment[] = [];
  let display = "";
  let cursor = 0;

  const pushLiteral = (text: string, rawStart: number) => {
    if (!text) return;
    segments.push({
      isMention: false,
      text,
      rawStart,
      rawEnd: rawStart + text.length,
      displayStart: display.length,
      displayEnd: display.length + text.length,
    });
    display += text;
  };

  for (const match of raw.matchAll(MENTION_REGEX)) {
    const rawStart = match.index ?? 0;
    pushLiteral(raw.slice(cursor, rawStart), cursor);
    const label = `@${match[1]}`;
    segments.push({
      isMention: true,
      text: label,
      userId: match[2],
      rawStart,
      rawEnd: rawStart + match[0].length,
      displayStart: display.length,
      displayEnd: display.length + label.length,
    });
    display += label;
    cursor = rawStart + match[0].length;
  }
  pushLiteral(raw.slice(cursor), cursor);

  return { display, segments };
};

/**
 * Translates a display index into a raw index. When the index lands inside a
 * mention, `edge` decides whether it snaps to the start or the end of it, so
 * partially-touched mentions are always replaced whole.
 */
export const mapDisplayIndexToRaw = (
  segments: MentionSegment[],
  displayIndex: number,
  edge: "start" | "end" = "start",
): number => {
  for (const s of segments) {
    if (displayIndex < s.displayStart) break;
    if (displayIndex > s.displayEnd) continue;
    if (s.isMention) {
      if (displayIndex === s.displayStart) return s.rawStart;
      if (displayIndex === s.displayEnd) return s.rawEnd;
      return edge === "start" ? s.rawStart : s.rawEnd;
    }
    return s.rawStart + (displayIndex - s.displayStart);
  }
  return segments.length
    ? segments[segments.length - 1].rawEnd
    : displayIndex;
};

/** Translates a raw index into its display index. */
export const mapRawIndexToDisplay = (segments: MentionSegment[], rawIndex: number): number => {
  for (const s of segments) {
    if (rawIndex < s.rawStart) break;
    if (rawIndex > s.rawEnd) continue;
    if (s.isMention) return rawIndex === s.rawStart ? s.displayStart : s.displayEnd;
    return s.displayStart + (rawIndex - s.displayStart === 0 ? rawIndex - s.rawStart : rawIndex - s.rawStart);
  }
  return segments.length ? segments[segments.length - 1].displayEnd : rawIndex;
};

/**
 * Applies an edit made against the display text back onto the raw value by
 * diffing the old and new display strings.
 */
export const applyDisplayEdit = (
  raw: string,
  prevDisplay: string,
  nextDisplay: string,
): { raw: string; rawCaret: number } => {
  const { segments } = toDisplayText(raw);

  let prefix = 0;
  const maxPrefix = Math.min(prevDisplay.length, nextDisplay.length);
  while (prefix < maxPrefix && prevDisplay[prefix] === nextDisplay[prefix]) prefix++;

  let suffix = 0;
  const maxSuffix = Math.min(prevDisplay.length, nextDisplay.length) - prefix;
  while (
    suffix < maxSuffix &&
    prevDisplay[prevDisplay.length - 1 - suffix] === nextDisplay[nextDisplay.length - 1 - suffix]
  ) {
    suffix++;
  }

  const displayStart = prefix;
  const displayEnd = prevDisplay.length - suffix;
  const inserted = nextDisplay.slice(prefix, nextDisplay.length - suffix);

  const rawStart = mapDisplayIndexToRaw(segments, displayStart, "start");
  const rawEnd = Math.max(rawStart, mapDisplayIndexToRaw(segments, displayEnd, "end"));

  return {
    raw: `${raw.slice(0, rawStart)}${inserted}${raw.slice(rawEnd)}`,
    rawCaret: rawStart + inserted.length,
  };
};

/**
 * Finds the `@token` the caret is currently sitting in, if any.
 * Returns null when the caret is not inside an active mention query.
 */
export const findActiveMentionQuery = (
  text: string,
  caret: number,
): { query: string; start: number; end: number } | null => {
  const before = text.slice(0, caret);
  const match = before.match(/(?:^|\s)@([\p{L}\p{N}'.\- ]{0,30})$/u);
  if (!match) return null;
  const query = match[1];
  // Bail out once the token runs long without matching anything sensible.
  if (query.includes("\n")) return null;
  const start = caret - query.length - 1;
  return { query, start, end: caret };
};
