import { useState, useMemo } from "react";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import {
  ArrowBigUp, ArrowBigDown, MessageSquare, Plus, Search, ArrowLeft,
  CheckCircle2, Sparkles, X, Check
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
import { useProfile } from "@/hooks/useProfile";
import { RoleBadge } from "@/components/RoleBadge";
import { LinkifyText } from "@/components/LinkifyText";
import { ContentActionsMenu } from "@/components/moderation/ContentActionsMenu";
import { PageHeader } from "@/components/layout/PageHeader";
import { ThreadSummaryCard } from "@/components/community/ThreadSummaryCard";
import { RecommendedPeersCard } from "@/components/community/RecommendedPeersCard";
import { TrendingTagsCard } from "@/components/community/TrendingTagsCard";
import { TopMentorsCard } from "@/components/community/TopMentorsCard";
import { MentorshipButton } from "@/components/mentorship/MentorshipButton";
import { useAdminRole } from "@/hooks/useAdminRole";

import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

const initialsOf = (name?: string | null) =>
  (name || "U").split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();

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

const AuthorLine = ({
  profile,
  timestamp,
  isAnonymous,
  isSelf,
}: {
  profile: Question["profiles"];
  timestamp: string;
  isAnonymous?: boolean;
  isSelf?: boolean;
}) => {
  if (isAnonymous) {
    return (
      <div className="flex items-center gap-2 text-xs text-muted-foreground min-w-0">
        <Avatar className="h-8 w-8">
          <AvatarFallback className="bg-muted text-muted-foreground text-[11px]">?</AvatarFallback>
        </Avatar>
        <span className="font-medium text-foreground truncate">Anonymous</span>
        {isSelf && <span className="text-[10px] uppercase tracking-wide text-secondary shrink-0">you</span>}
        <span className="shrink-0">· {formatDistanceToNow(new Date(timestamp), { addSuffix: true })}</span>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground min-w-0">
      <Avatar className="h-8 w-8 shrink-0">
        <AvatarImage src={profile?.avatar_url || undefined} />
        <AvatarFallback className="bg-primary text-primary-foreground text-[11px]">
          {initialsOf(profile?.full_name)}
        </AvatarFallback>
      </Avatar>
      <div className="flex items-center gap-2 min-w-0 flex-wrap sm:flex-nowrap">
        <Link to={profile?.id ? `/profile?userId=${profile.id}` : "#"} className="font-medium text-foreground hover:underline truncate">
          {profile?.full_name || "Anonymous"}
        </Link>
        <RoleBadge profile={profile} compact className="shrink-0" />
        {profile?.job_title && <span className="hidden md:inline shrink-0">· {profile.job_title}</span>}
        <span className="shrink-0">· {formatDistanceToNow(new Date(timestamp), { addSuffix: true })}</span>
      </div>
    </div>
  );
};

// -------------- List View --------------
const QuestionsList = ({
  onAsk,
  activeTag,
  onTagSelect,
}: {
  onAsk: () => void;
  activeTag: string | null;
  onTagSelect: (tag: string | null) => void;
}) => {
  const [sort, setSort] = useState<QuestionSort>("new");
  const [search, setSearch] = useState("");
  const { data: questions = [], isLoading } = useQuestions(sort, search, activeTag);

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
    <div className="space-y-6">
      <Card>
        <CardContent className="p-5 space-y-4">
          <PageHeader
            title="Community Q&amp;A"
            subtitle="Ask questions, share advice, and learn from students and recruiters across the community."
            icon={Sparkles}
            className="mb-0"
          />
          <div className="flex flex-col sm:flex-row gap-3">
            <Button onClick={onAsk} className="gap-2 shrink-0">
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
          <div className="flex items-center gap-2 flex-wrap">
            {(["new", "top", "unanswered"] as QuestionSort[]).map((s) => (
              <Button
                key={s}
                size="sm"
                variant={sort === s ? "default" : "outline"}
                onClick={() => setSort(s)}
                className="capitalize h-9 px-4 rounded-full"
              >
                {s === "top" ? "Top" : s === "new" ? "New" : "Unanswered"}
              </Button>
            ))}
            {activeTag && (
              <Button
                size="sm"
                variant="secondary"
                onClick={() => onTagSelect(null)}
                className="h-9 gap-1.5 rounded-full px-4"
              >
                #{activeTag}
                <X className="h-3.5 w-3.5" />
              </Button>
            )}
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
            <CardContent className="p-5 flex gap-4">
              <div className="flex-shrink-0 pt-0.5">
                <VoteBox
                  score={q.upvotes}
                  myVote={myVotes?.get(q.id) ?? 0}
                  onVote={(v) => handleVote(q, v)}
                  size="sm"
                />
              </div>
              <div className="flex-1 min-w-0 space-y-3">
                <h2 className="font-semibold text-base leading-snug">{q.title}</h2>
                {q.body && (
                  <p className="text-sm text-muted-foreground line-clamp-3 whitespace-pre-wrap break-words leading-relaxed">
                    {q.body}
                  </p>
                )}
                {q.tags?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {q.tags.map((t) => (
                      <Badge key={t} variant="secondary" className="text-[10px]">#{t}</Badge>
                    ))}
                  </div>
                )}
                <div className="flex items-center justify-between gap-3 pt-1">
                  <AuthorLine
                    profile={q.profiles}
                    timestamp={q.created_at}
                    isAnonymous={q.is_anonymous}
                    isSelf={user?.id === q.author_id}
                  />
                  <Badge variant="outline" className="shrink-0 gap-1.5 px-2.5 py-1 text-xs font-medium">
                    <MessageSquare className="h-3.5 w-3.5" />
                    {q.answer_count} {q.answer_count === 1 ? "answer" : "answers"}
                  </Badge>
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
  const [answerAnon, setAnswerAnon] = useState(false);
  const { data: myProfile } = useProfile();
  const { isAdmin } = useAdminRole();

  const recruiterBlocked =
    !!myProfile && (myProfile.profile_type === "recruiter" || myProfile.is_verified_recruiter === true);
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
  const canAccept = isOwner || isAdmin;


  return (
    <div className="space-y-4">
      <Button variant="ghost" size="sm" onClick={() => navigate("/community")} className="-ml-2 gap-1 text-muted-foreground">
        <ArrowLeft className="h-4 w-4" /> All questions
      </Button>

      <ThreadSummaryCard
        questionId={question.id}
        title={question.title}
        question={question.body || ""}
        answers={answers.map((a) => a.body)}
      />



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
              <AuthorLine
                profile={question.profiles}
                timestamp={question.created_at}
                isAnonymous={question.is_anonymous}
                isSelf={user?.id === question.author_id}
              />
              <ContentActionsMenu
                targetType="question"
                targetId={question.id}
                authorId={question.author_id}
                authorName={question.profiles?.full_name}
                contentPreview={question.title}
                allowBlock={!question.is_anonymous}
                onDelete={
                  isOwner
                    ? () => {
                        if (confirm("Delete this question and all its answers?")) {
                          deleteQuestion.mutate(question.id, {
                            onSuccess: () => navigate("/community"),
                          });
                        }
                      }
                    : undefined
                }
              />
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
              <Card
                key={a.id}
                className={cn(a.is_accepted && "border-success bg-success-muted/40 ring-1 ring-success/30")}
              >
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
                      <Badge className="gap-1 bg-success text-success-foreground hover:bg-success">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Accepted Answer
                      </Badge>
                    )}

                    <div className="text-sm whitespace-pre-wrap break-words leading-relaxed">
                      <LinkifyText>{a.body}</LinkifyText>
                    </div>
                    <div className="flex items-center justify-between gap-2 flex-wrap pt-1">
                      <AuthorLine
                        profile={a.profiles}
                        timestamp={a.created_at}
                        isAnonymous={a.is_anonymous}
                        isSelf={user?.id === a.author_id}
                      />
                      <div className="flex items-center gap-1">
                        <MentorshipButton
                          profile={a.profiles}
                          size="sm"
                          variant="outline"
                          label="Book 1-on-1"
                          className="h-7 text-xs"
                        />
                        {canAccept && (
                          <Button
                            size="sm"
                            variant={a.is_accepted ? "secondary" : "ghost"}
                            className={cn(
                              "h-7 gap-1 text-xs",
                              a.is_accepted
                                ? "bg-success text-success-foreground hover:bg-success/90"
                                : "text-muted-foreground hover:text-success"
                            )}
                            title={a.is_accepted ? "Remove accepted answer" : "Mark as accepted answer"}
                            aria-label={a.is_accepted ? "Remove accepted answer" : "Mark as accepted answer"}
                            onClick={() =>
                              acceptAnswer.mutate({ answerId: a.id, questionId: question.id, accepted: !a.is_accepted })
                            }
                          >
                            <Check className="h-3.5 w-3.5" />
                            {a.is_accepted ? "Accepted" : "Accept"}
                          </Button>
                        )}

                        <ContentActionsMenu
                          size="sm"
                          targetType="answer"
                          targetId={a.id}
                          authorId={a.author_id}
                          authorName={a.profiles?.full_name}
                          contentPreview={a.body}
                          allowBlock={!a.is_anonymous}
                          onDelete={
                            isAnswerOwner
                              ? () => {
                                  if (confirm("Delete this answer?")) {
                                    deleteAnswer.mutate({ id: a.id, questionId: question.id });
                                  }
                                }
                              : undefined
                          }
                        />
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
          <label
            className={cn(
              "flex items-start gap-2 text-sm",
              recruiterBlocked && "opacity-60 cursor-not-allowed"
            )}
            title={recruiterBlocked ? "Recruiters cannot answer anonymously — your verified badge must stay visible." : undefined}
          >
            <Checkbox
              checked={answerAnon}
              disabled={recruiterBlocked}
              onCheckedChange={(v) => setAnswerAnon(!!v)}
              className="mt-0.5"
            />
            <span className="text-muted-foreground">
              Answer anonymously
              {recruiterBlocked && (
                <span className="block text-xs">Recruiters must answer under their verified identity.</span>
              )}
            </span>
          </label>
          <div className="flex justify-end">
            <Button
              disabled={!answerBody.trim() || createAnswer.isPending}
              onClick={() => {
                if (!requireAuth()) return;
                createAnswer.mutate(
                  { questionId: question.id, body: answerBody, isAnonymous: answerAnon && !recruiterBlocked },
                  { onSuccess: () => { setAnswerBody(""); setAnswerAnon(false); } }
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
  const activeTag = params.get("tag");
  const [askOpen, setAskOpen] = useState(false);
  const navigate = useNavigate();

  const handleTagSelect = (tag: string | null) => {
    const next = new URLSearchParams(params);
    next.delete("id");
    if (tag) next.set("tag", tag);
    else next.delete("tag");
    setParams(next);
  };

  const sidebar = (
    <>
      <TrendingTagsCard activeTag={activeTag} onSelect={handleTagSelect} />
      <TopMentorsCard />
      <RecommendedPeersCard />
    </>
  );

  return (
    <div className="min-h-screen bg-muted/30">
      <Navbar />
      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 max-w-6xl">
        <div className="lg:grid lg:grid-cols-12 lg:gap-6">
          <div className="lg:col-span-9 min-w-0">
            {id ? (
              <QuestionDetail id={id} />
            ) : (
              <QuestionsList
                onAsk={() => setAskOpen(true)}
                activeTag={activeTag}
                onTagSelect={handleTagSelect}
              />
            )}
            <div className="mt-6 space-y-4 lg:hidden">{sidebar}</div>
          </div>
          <aside className="hidden lg:block lg:col-span-3 lg:sticky lg:top-20 lg:self-start space-y-4">
            {sidebar}
          </aside>
        </div>
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
