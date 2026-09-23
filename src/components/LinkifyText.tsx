import React from "react";
import { Link } from "react-router-dom";

const URL_REGEX = /(https?:\/\/[^\s<]+(?:\([^\s<)]*\))?[^\s<.,;:!?"')}\]]*)/gi;
const MENTION_SOURCE = /@\[([^\]]+)\]\(([0-9a-fA-F-]{36})\)/g;

interface LinkifyTextProps {
  children: string;
}

/** Splits text into plain text, URLs, and @mention tokens. */
type Token =
  | { kind: "text"; value: string }
  | { kind: "url"; value: string }
  | { kind: "mention"; name: string; userId: string };

const tokenize = (text: string): Token[] => {
  const tokens: Token[] = [];
  const mentionRe = new RegExp(MENTION_SOURCE.source, "g");
  let lastIndex = 0;
  let m: RegExpExecArray | null;

  const pushText = (value: string) => {
    if (!value) return;
    const urlRe = new RegExp(URL_REGEX.source, "gi");
    let last = 0;
    let u: RegExpExecArray | null;
    while ((u = urlRe.exec(value)) !== null) {
      if (u.index > last) tokens.push({ kind: "text", value: value.slice(last, u.index) });
      tokens.push({ kind: "url", value: u[0] });
      last = u.index + u[0].length;
    }
    if (last < value.length) tokens.push({ kind: "text", value: value.slice(last) });
  };

  while ((m = mentionRe.exec(text)) !== null) {
    pushText(text.slice(lastIndex, m.index));
    tokens.push({ kind: "mention", name: m[1], userId: m[2] });
    lastIndex = m.index + m[0].length;
  }
  pushText(text.slice(lastIndex));

  return tokens;
};

export const LinkifyText = ({ children }: LinkifyTextProps) => {
  if (!children) return null;

  return (
    <>
      {tokenize(children).map((token, i) => {
        if (token.kind === "url") {
          return (
            <a
              key={i}
              href={token.value}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline hover:text-primary/80 break-all"
            >
              {token.value}
            </a>
          );
        }
        if (token.kind === "mention") {
          return (
            <Link
              key={i}
              to={`/profile?userId=${token.userId}`}
              className="font-medium text-primary hover:underline"
            >
              @{token.name}
            </Link>
          );
        }
        return <React.Fragment key={i}>{token.value}</React.Fragment>;
      })}
    </>
  );
};
