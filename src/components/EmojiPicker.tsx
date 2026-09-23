import { useMemo, useState, type ReactNode } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";

interface EmojiEntry {
  char: string;
  keywords: string;
}

const GROUPS: { label: string; emojis: EmojiEntry[] }[] = [
  {
    label: "Smileys",
    emojis: [
      { char: "😀", keywords: "grin happy smile" },
      { char: "😃", keywords: "smile happy" },
      { char: "😄", keywords: "laugh happy" },
      { char: "😁", keywords: "beam grin" },
      { char: "😆", keywords: "laugh lol" },
      { char: "😂", keywords: "lol tears laugh crying" },
      { char: "🤣", keywords: "rofl laugh" },
      { char: "🙂", keywords: "slight smile" },
      { char: "😉", keywords: "wink" },
      { char: "😊", keywords: "blush smile" },
      { char: "😍", keywords: "love heart eyes" },
      { char: "🥰", keywords: "love hearts" },
      { char: "😘", keywords: "kiss" },
      { char: "😎", keywords: "cool sunglasses" },
      { char: "🤩", keywords: "star struck wow" },
      { char: "🥳", keywords: "party celebrate" },
      { char: "🤔", keywords: "think hmm" },
      { char: "😅", keywords: "sweat laugh nervous" },
      { char: "🙃", keywords: "upside down" },
      { char: "😴", keywords: "sleep tired" },
      { char: "😢", keywords: "sad cry" },
      { char: "😭", keywords: "sob cry sad" },
      { char: "😤", keywords: "frustrated" },
      { char: "😳", keywords: "flushed embarrassed" },
      { char: "🤯", keywords: "mind blown wow" },
      { char: "😬", keywords: "grimace awkward" },
      { char: "🙄", keywords: "eye roll" },
      { char: "😇", keywords: "angel innocent" },
      { char: "🥲", keywords: "grateful tear" },
      { char: "😐", keywords: "neutral" },
    ],
  },
  {
    label: "Reactions",
    emojis: [
      { char: "👍", keywords: "thumbs up like yes" },
      { char: "👎", keywords: "thumbs down dislike" },
      { char: "👏", keywords: "clap applause" },
      { char: "🙌", keywords: "praise celebrate hands" },
      { char: "🤝", keywords: "handshake deal" },
      { char: "🙏", keywords: "thanks please pray" },
      { char: "💪", keywords: "strong muscle" },
      { char: "👌", keywords: "ok perfect" },
      { char: "🤞", keywords: "fingers crossed luck" },
      { char: "✌️", keywords: "peace" },
      { char: "🫶", keywords: "heart hands love" },
      { char: "👀", keywords: "eyes looking" },
      { char: "❤️", keywords: "heart love red" },
      { char: "🧡", keywords: "orange heart" },
      { char: "💙", keywords: "blue heart" },
      { char: "💚", keywords: "green heart" },
      { char: "💜", keywords: "purple heart" },
      { char: "🖤", keywords: "black heart" },
      { char: "💯", keywords: "hundred perfect" },
      { char: "🔥", keywords: "fire lit hot" },
      { char: "✨", keywords: "sparkles shine" },
      { char: "🎉", keywords: "party tada celebrate" },
      { char: "🎊", keywords: "confetti celebrate" },
      { char: "⭐", keywords: "star" },
    ],
  },
  {
    label: "Work & study",
    emojis: [
      { char: "💻", keywords: "laptop code work" },
      { char: "🖥️", keywords: "desktop computer" },
      { char: "⌨️", keywords: "keyboard typing" },
      { char: "📱", keywords: "phone mobile" },
      { char: "📈", keywords: "growth chart up" },
      { char: "📉", keywords: "chart down" },
      { char: "📊", keywords: "chart data" },
      { char: "📝", keywords: "note write memo" },
      { char: "📚", keywords: "books study" },
      { char: "🎓", keywords: "graduate school student" },
      { char: "🧠", keywords: "brain smart" },
      { char: "💡", keywords: "idea lightbulb" },
      { char: "🚀", keywords: "rocket launch ship" },
      { char: "🛠️", keywords: "tools build" },
      { char: "🐛", keywords: "bug issue" },
      { char: "✅", keywords: "check done yes" },
      { char: "❌", keywords: "cross no wrong" },
      { char: "⏰", keywords: "clock time alarm" },
      { char: "📅", keywords: "calendar date" },
      { char: "📌", keywords: "pin important" },
      { char: "🔗", keywords: "link url" },
      { char: "💼", keywords: "briefcase job work" },
      { char: "☕", keywords: "coffee" },
      { char: "🏆", keywords: "trophy win award" },
    ],
  },
];

interface EmojiPickerProps {
  onSelect: (emoji: string) => void;
  trigger: ReactNode;
  align?: "start" | "center" | "end";
}

export const EmojiPicker = ({ onSelect, trigger, align = "end" }: EmojiPickerProps) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const groups = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return GROUPS;
    return GROUPS.map((g) => ({
      label: g.label,
      emojis: g.emojis.filter((e) => e.keywords.includes(q) || e.char === q),
    })).filter((g) => g.emojis.length > 0);
  }, [search]);

  const pick = (emoji: string) => {
    onSelect(emoji);
    setOpen(false);
    setSearch("");
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent align={align} className="w-[300px] max-w-[92vw] p-0">
        <div className="border-b border-border p-2">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search emoji..."
            className="h-8 text-sm"
            aria-label="Search emoji"
          />
        </div>
        <ScrollArea className="h-64">
          <div className="p-2 space-y-3">
            {groups.map((group) => (
              <div key={group.label}>
                <p className="px-1 pb-1 text-[11px] uppercase tracking-wide text-muted-foreground">
                  {group.label}
                </p>
                <div className="grid grid-cols-8 gap-0.5">
                  {group.emojis.map((e) => (
                    <button
                      key={e.char}
                      type="button"
                      onClick={() => pick(e.char)}
                      aria-label={e.keywords.split(" ")[0]}
                      className="flex h-8 w-8 items-center justify-center rounded-md text-lg hover:bg-muted"
                    >
                      {e.char}
                    </button>
                  ))}
                </div>
              </div>
            ))}
            {groups.length === 0 && (
              <p className="py-6 text-center text-sm text-muted-foreground">No emoji found</p>
            )}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};
