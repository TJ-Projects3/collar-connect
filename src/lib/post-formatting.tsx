import { ReactNode } from "react";
import { LinkifyText } from "@/components/LinkifyText";

/**
 * Render post content with basic markdown-lite support:
 *  - preserves line breaks
 *  - lines starting with "- " or "* " render as bullet items
 *  - **bold** and *italic* inline
 *  - URLs are auto-linked via LinkifyText
 */
export const renderPostContent = (content: string): ReactNode => {
  const lines = content.split("\n");
  const blocks: ReactNode[] = [];
  let bulletBuffer: string[] = [];
  let key = 0;

  const flushBullets = () => {
    if (bulletBuffer.length === 0) return;
    const items = [...bulletBuffer];
    bulletBuffer = [];
    blocks.push(
      <ul key={`ul-${key++}`} className="list-disc pl-5 space-y-1 my-1">
        {items.map((item, i) => (
          <li key={i}>{renderInline(item)}</li>
        ))}
      </ul>
    );
  };

  lines.forEach((rawLine, idx) => {
    const line = rawLine.replace(/\r$/, "");
    const bulletMatch = line.match(/^\s*[-*]\s+(.*)$/);
    if (bulletMatch) {
      bulletBuffer.push(bulletMatch[1]);
      return;
    }
    flushBullets();
    if (line.trim() === "") {
      blocks.push(<div key={`br-${key++}`} className="h-2" aria-hidden />);
    } else {
      blocks.push(
        <p key={`p-${key++}`} className="leading-relaxed whitespace-pre-wrap">
          {renderInline(line)}
        </p>
      );
    }
  });
  flushBullets();

  return <div className="space-y-1">{blocks}</div>;
};

// Inline formatter: **bold** and *italic*, then linkify URLs
const renderInline = (text: string): ReactNode => {
  // Tokenize bold/italic
  const tokens: { kind: "text" | "bold" | "italic"; value: string }[] = [];
  const regex = /(\*\*[^*]+\*\*|\*[^*]+\*)/g;
  let lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = regex.exec(text)) !== null) {
    if (m.index > lastIndex) {
      tokens.push({ kind: "text", value: text.slice(lastIndex, m.index) });
    }
    const match = m[0];
    if (match.startsWith("**")) {
      tokens.push({ kind: "bold", value: match.slice(2, -2) });
    } else {
      tokens.push({ kind: "italic", value: match.slice(1, -1) });
    }
    lastIndex = m.index + match.length;
  }
  if (lastIndex < text.length) {
    tokens.push({ kind: "text", value: text.slice(lastIndex) });
  }
  if (tokens.length === 0) tokens.push({ kind: "text", value: text });

  return tokens.map((t, i) => {
    const inner = <LinkifyText>{t.value}</LinkifyText>;
    if (t.kind === "bold") return <strong key={i}>{inner}</strong>;
    if (t.kind === "italic") return <em key={i}>{inner}</em>;
    return <span key={i}>{inner}</span>;
  });
};
