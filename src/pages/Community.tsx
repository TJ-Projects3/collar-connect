import { useState, useMemo } from "react";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  ArrowBigUp, ArrowBigDown, MessageSquare, Plus, Search, ArrowLeft,
  CheckCircle2, Trash2, Sparkles, Filter
} from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import {
  useQuestions, useQuestion, useAnswers, useCreateAnswer,
  useDeleteQuestion, useDeleteAnswer, useAcceptAnswer, useVote,
  useMyQuestionVotes, useMyAnswerVotes, QuestionSort, Question, Answer,
} from "@/hooks/useQuestions";
import { AskQuestionModal } from "@/components/AskQuestionModal";
import { useAuth } from "@/contexts/AuthContext";
import { RecruiterBadge } from "@/components/RecruiterBadge";
import { LinkifyText } from "@/components/LinkifyText";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

const initialsOf = (name?: string | null) =>
  (name || "U").split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();

const isRecruiter = (p: Question["profiles"] | Answer["profiles"]) =>
  !!p && (p.profile_type === "recruiter" || p.is_verified_recruiter);

interface VoteBoxProps {
  score: number;
  myVote: number;
  onVote: (v: 1 | -1) => void;
  size?: "sm" | "md";
  vertical?: boolean;
}
const VoteBox = ({ score, myVote, onVote, size = "md", vertical = true }: VoteBoxProps) => {
  const iconClass = size === "sm" ? "h-5 w-5" : "h-6 w-6";
  return (
    <div className={cn("flex items-center gap-0.5", vertical && "flex-col")}>
      <button
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); onVote(1); }}
        className={cn(
          "rounded p-1 hover:bg-muted transition-colors",
          myVote === 1 ? "text-secondary" : "text-muted-foreground"
        )}
        aria-label="Upvote"
      >
        <ArrowBigUp className={cn(iconClass, myVote === 1 && "fill-current")} />
      </button>
      <span className={cn("text-sm font-semibold tabular-nums min-w-[1.5rem] text-center",
        myVote === 1 ? "text-secondary" : myVote === -1 ? "text-destructive" : "text-foreground"
      )}>
        {score}
      </span>
      <button
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); onVote(-1); }}
        className={cn(
          "rounded p-1 hover:bg-muted transition-colors",
          myVote === -1 ? "text-destructive" : "text-muted-foreground"
        )}
        aria-label="Downvote"
      >
        <ArrowBigDown className={cn(iconClass, myVote === -1 && "fill-current")} />
      </button>
    </div>
  );
};

const AuthorLine = ({ profile, timestamp }: { profile: Question["profiles"]; timestamp: string }) => (
  <div className="flex items-center gap-2 text-xs text-muted-foreground">
    <Avatar className="h-6 w-6">
      <AvatarImage src={profile?.avatar_url || undefined} />
      <AvatarFallback className="bg-primary text-primary-foreground text-[10px]">
        {initialsOf(profile?.full_name)}
      </AvatarFallback>
    </Avatar>
    <Link to={profile?.id ? `/profile?userId=${profile.id}` : "#"} className="font-medium text-foreground hover:underline">
      {profile?.full_name || "Anonymous"}
    </Link>
    {isRecruiter(profile) && <RecruiterBadge compact verified={!!profile?.is_verified_recruiter} />}
    {profile?.job_title && <span className="hidden sm:inline">· {profile.job_title}</span>}
    <span>· {formatDistanceToNow(new Date(timestamp), { addSuffix: true })}</span>
  </div>
);

// -------------- List View --------------
const QuestionsList = ({ onAsk }: { onAsk: () => void }) => {
  const [sort, setSort] = useState<QuestionSort>("new");
  const [search, setSearch] = useState("");
  const { data: questions = [], isLoading } = useQuestions(sort, search);
  const vote = useVote();
  const ids = useMemo(() => questions.map((q) => q.id), [questions]);
  const { data: myVotes } = useMyQuestionVotes(ids);
  const { user } = useAuth();
  const { toast } = useToast();

  const handleVote = (q: Question, value: 1 | -1) => {
    if (!user) { toast({ title: "Sign in to vote" }); return; }
    const current = myVotes?.get(q.id) ?? 0;
    vote.mutate({ questionId: q.id, value, current });
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-secondary" />
            <h1 className="text-xl font-bold">Community Q&amp;A</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Ask questions, share advice, and learn from students and recruiters across the community.
          </p>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button onClick={onAsk} className="gap-2">
              <Plus className="h-4 w-4" /> Ask a Question
            </Button>
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search questions..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
          <div className="flex items-center gap-1 flex-wrap">
            <Filter className="h-4 w-4 text-muted-foreground mr-1" />
            {(["new", "top", "unanswered"] as QuestionSort[]).map((s) => (
              <Button
                key={s}
                size="sm"
                variant={sort === s ? "default" : "ghost"}
                onClick={() => setSort(s)}
                className="capitalize h-8"
              >
                {s === "top" ? "Top" : s === "new" ? "New" : "Unanswered"}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {isLoading && <p className="text-sm text-muted-foreground text-center py-8">Loading...</p>}
      {!isLoading && questions.length === 0 && (
        <Card>
          <CardContent className="py-10 text-center space-y-3">
            <p className="text-muted-foreground">No questions yet. Be the first to ask!</p>
            <Button onClick={onAsk} className="gap-2"><Plus className="h-4 w-4" /> Ask a Question</Button>
          </CardContent>
        </Card>
      )}

      {questions.map((q) => (
        <Link key={q.id} to={`/community?id=${q.id}`} className="block">
          <Card className="hover:border-primary/40 transition-colors">
            <CardContent className="p-4 flex gap-3">
              <div className="flex-shrink-0">
                <VoteBox
                  score={q.upvotes}
                  myVote={myVotes?.get(q.id) ?? 0}
                  onVote={(v) => handleVote(q, v)}
                  size="sm"
                />
              </div>
              <div className="flex-1 min-w-0 space-y-2">
                <h2 className="font-semibold text-base leading-snug line-clamp-2">{q.title}</h2>
                {q.body && (
                  <p className="text-sm text-muted-foreground line-clamp-2 whitespace-pre-wrap break-words">
                    {q.body}
                  </p>
                )}
                {q.tags?.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {q.tags.map((t) => (
                      <Badge key={t} variant="secondary" className="text-[10px]">#{t}</Badge>
                    ))}
                  </div>
                )}
                <div className="flex items-center justify-between gap-2">
                  <AuthorLine profile={q.profiles} timestamp={q.created_at} />
                  <span className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                    <MessageSquare className="h-3.5 w-3.5" />
                    {q.answer_count} {q.answer_count === 1 ? "answer" : "answers"}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
};

// -------------- Detail View --------------
const QuestionDetail = ({ id }: { id: string }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const { data: question, isLoading } = useQuestion(id);
  const { data: answers = [] } = useAnswers(id);
  const [answerBody, setAnswerBody] = useState("");
  const createAnswer = useCreateAnswer();
  const deleteQuestion = useDeleteQuestion();
  const deleteAnswer = useDeleteAnswer();
  const acceptAnswer = useAcceptAnswer();
  const vote = useVote();

  const answerIds = useMemo(() => answers.map((a) => a.id), [answers]);
  const { data: myQVotes } = useMyQuestionVotes(id ? [id] : []);
  const { data: myAVotes } = useMyAnswerVotes(answerIds);

  const requireAuth = () => {
    if (!user) { toast({ title: "Sign in to continue" }); return false; }
    return true;
  };

  if (isLoading) return <p className="text-center py-10 text-muted-foreground">Loading...</p>;
  if (!question) return (
    <Card><CardContent className="py-10 text-center">
      <p className="text-muted-foreground mb-3">Question not found.</p>
      <Button variant="outline" onClick={() => navigate("/community")}>Back to Q&amp;A</Button>
    </CardContent></Card>
  );

  const isOwner = user?.id === question.author_id;

  return (
    <div className="space-y-4">
      <Button variant="ghost" size="sm" onClick={() => navigate("/community")} className="gap-1">
        <ArrowLeft className="h-4 w-4" /> All questions
      </Button>

      <Card>
        <CardContent className="p-5 flex gap-4">
          <VoteBox
            score={question.upvotes}
            myVote={myQVotes?.get(question.id) ?? 0}
            onVote={(v) => {
              if (!requireAuth()) return;
              vote.mutate({ questionId: question.id, value: v, current: myQVotes?.get(question.id) ?? 0 });
            }}
          />
          <div className="flex-1 min-w-0 space-y-3">
            <h1 className="text-2xl font-bold leading-tight">{question.title}</h1>
            {question.body && (
              <div className="text-sm whitespace-pre-wrap break-words leading-relaxed">
                <LinkifyText>{question.body}</LinkifyText>
              </div>
            )}
            {question.tags?.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {question.tags.map((t) => (
                  <Badge key={t} variant="secondary">#{t}</Badge>
                ))}
              </div>
            )}
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <AuthorLine profile={question.profiles} timestamp={question.created_at} />
              {isOwner && (
                <Button
                  size="sm" variant="ghost"
                  className="text-destructive hover:text-destructive gap-1"
                  onClick={() => {
                    if (confirm("Delete this question and all its answers?")) {
                      deleteQuestion.mutate(question.id, { onSuccess: () => navigate("/community") });
                    }
                  }}
                >
                  <Trash2 className="h-4 w-4" /> Delete
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div>
        <h2 className="font-semibold text-lg mb-2">
          {answers.length} {answers.length === 1 ? "Answer" : "Answers"}
        </h2>
        <Separator className="mb-3" />
        <div className="space-y-3">
          {answers.map((a) => {
            const isAnswerOwner = user?.id === a.author_id;
            return (
              <Card key={a.id} className={cn(a.is_accepted && "border-secondary")}>
                <CardContent className="p-4 flex gap-3">
                  <VoteBox
                    score={a.upvotes}
                    myVote={myAVotes?.get(a.id) ?? 0}
                    onVote={(v) => {
                      if (!requireAuth()) return;
                      vote.mutate({ answerId: a.id, value: v, current: myAVotes?.get(a.id) ?? 0 });
                    }}
                    size="sm"
                  />
                  <div className="flex-1 min-w-0 space-y-2">
                    {a.is_accepted && (
                      <div className="inline-flex items-center gap-1 text-xs font-semibold text-secondary">
                        <CheckCircle2 className="h-4 w-4" /> Accepted answer
                      </div>
                    )}
                    <div className="text-sm whitespace-pre-wrap break-words leading-relaxed">
                      <LinkifyText>{a.body}</LinkifyText>
                    </div>
                    <div className="flex items-center justify-between gap-2 flex-wrap pt-1">
                      <AuthorLine profile={a.profiles} timestamp={a.created_at} />
                      <div className="flex gap-1">
                        {isOwner && (
                          <Button
                            size="sm" variant="ghost"
                            className={cn("gap-1 h-7 text-xs", a.is_accepted && "text-secondary")}
                            onClick={() =>
                              acceptAnswer.mutate({ answerId: a.id, questionId: question.id, accepted: !a.is_accepted })
                            }
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            {a.is_accepted ? "Unaccept" : "Accept"}
                          </Button>
                        )}
                        {isAnswerOwner && (
                          <Button
                            size="sm" variant="ghost"
                            className="text-destructive hover:text-destructive gap-1 h-7 text-xs"
                            onClick={() => {
                              if (confirm("Delete this answer?")) {
                                deleteAnswer.mutate({ id: a.id, questionId: question.id });
                              }
                            }}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      <Card>
        <CardContent className="p-4 space-y-3">
          <h3 className="font-semibold">Your Answer</h3>
          <Textarea
            placeholder="Share your advice, experience, or resources..."
            rows={5}
            value={answerBody}
            onChange={(e) => setAnswerBody(e.target.value)}
            maxLength={5000}
          />
          <div className="flex justify-end">
            <Button
              disabled={!answerBody.trim() || createAnswer.isPending}
              onClick={() => {
                if (!requireAuth()) return;
                createAnswer.mutate(
                  { questionId: question.id, body: answerBody },
                  { onSuccess: () => setAnswerBody("") }
                );
              }}
            >
              {createAnswer.isPending ? "Posting..." : "Post Answer"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// -------------- Page Shell --------------
const Community = () => {
  const [params, setParams] = useSearchParams();
  const id = params.get("id");
  const [askOpen, setAskOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-muted/30">
      <Navbar />
      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 max-w-3xl">
        {id ? <QuestionDetail id={id} /> : <QuestionsList onAsk={() => setAskOpen(true)} />}
      </main>
      <AskQuestionModal
        open={askOpen}
        onOpenChange={setAskOpen}
        onCreated={(newId) => navigate(`/community?id=${newId}`)}
      />
    </div>
  );
};

export default Community;
