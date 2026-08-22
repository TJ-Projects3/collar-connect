import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { CalendarClock, ExternalLink, Send } from "lucide-react";
import { useSendMessage } from "@/hooks/useMessaging";
import { cn } from "@/lib/utils";

export const MENTORSHIP_TOPICS = [
  "Code Review",
  "Resume Roast",
  "Career Guidance",
  "Interview Prep",
  "Portfolio Feedback",
  "Industry Insights",
];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mentorId: string;
  mentorName?: string | null;
  bookingUrl?: string | null;
  offerings?: string[];
}

export const MentorshipRequestModal = ({
  open, onOpenChange, mentorId, mentorName, bookingUrl, offerings = [],
}: Props) => {
  const [topics, setTopics] = useState<string[]>([]);
  const [note, setNote] = useState("");
  const sendMessage = useSendMessage();
  const navigate = useNavigate();

  const name = mentorName || "this mentor";
  const toggle = (topic: string) =>
    setTopics((prev) => (prev.includes(topic) ? prev.filter((t) => t !== topic) : [...prev, topic]));

  const close = () => {
    onOpenChange(false);
    setTopics([]);
    setNote("");
  };

  const handleSend = () => {
    const body = [
      "Mentorship request",
      topics.length ? `Topics: ${topics.join(", ")}` : null,
      note.trim() ? `Note: ${note.trim()}` : null,
      "Would you be open to a 1-on-1 session?",
    ]
      .filter(Boolean)
      .join("\n");

    sendMessage.mutate(
      { recipientId: mentorId, content: body },
      {
        onSuccess: () => {
          close();
          navigate(`/messages?recipientId=${mentorId}`);
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={(v) => (v ? onOpenChange(true) : close())}>
      <DialogContent className="sm:max-w-md">
        {bookingUrl ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CalendarClock className="h-5 w-5 text-secondary" />
                Book a 1-on-1 with {name}
              </DialogTitle>
              <DialogDescription>
                {name} uses an external scheduling page. Pick a time that works for both of you.
              </DialogDescription>
            </DialogHeader>

            {offerings.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Mentorship offerings
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {offerings.map((o) => (
                    <Badge key={o} variant="secondary" className="break-words">{o}</Badge>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button variant="outline" onClick={close}>Cancel</Button>
              <Button asChild className="gap-2">
                <a href={bookingUrl} target="_blank" rel="noopener noreferrer" onClick={close}>
                  <ExternalLink className="h-4 w-4" />
                  Open scheduling page
                </a>
              </Button>
            </div>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CalendarClock className="h-5 w-5 text-secondary" />
                Request mentorship from {name}
              </DialogTitle>
              <DialogDescription>
                Pick what you'd like help with. We'll send {name} a direct message with your request.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                What do you need help with?
              </p>
              <div className="flex flex-wrap gap-2">
                {MENTORSHIP_TOPICS.map((topic) => {
                  const active = topics.includes(topic);
                  return (
                    <button
                      key={topic}
                      type="button"
                      onClick={() => toggle(topic)}
                      className={cn(
                        "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                        active
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-background text-muted-foreground hover:bg-muted"
                      )}
                      aria-pressed={active}
                    >
                      {topic}
                    </button>
                  );
                })}
              </div>
            </div>

            <Textarea
              rows={4}
              maxLength={800}
              placeholder="Add context — your goals, timeline, or a link to your portfolio (optional)"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />

            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button variant="outline" onClick={close}>Cancel</Button>
              <Button
                className="gap-2"
                disabled={topics.length === 0 || sendMessage.isPending}
                onClick={handleSend}
              >
                <Send className="h-4 w-4" />
                {sendMessage.isPending ? "Sending..." : "Send request"}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
