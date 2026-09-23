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
