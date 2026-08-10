import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Navbar } from "@/components/Navbar";
import { Compass, Cloud, Shield, Database, Server, ArrowLeft, ArrowRight, RotateCcw, Loader2, Sparkles, CheckCircle2, Award, FolderGit2, Target, RefreshCw, Briefcase, DollarSign } from "lucide-react";
import { toast } from "sonner";
import { useGenerateRoadmap, type CareerRoadmap } from "@/hooks/useCareerRoadmap";

import {
  QUESTIONS,
  SECTIONS,
  LIKERT_OPTIONS,
  computeCareerResults,
  TRACK_META,
  type CareerResults,
  type TrackName,
} from "@/lib/career-scoring";
import {
  useCareerAssessment,
  useSaveAssessment,
  useDeleteAssessment,
} from "@/hooks/useCareerAssessment";

const TRACK_ICONS: Record<TrackName, React.ReactNode> = {
  Cloud: <Cloud className="h-8 w-8" />,
  Security: <Shield className="h-8 w-8" />,
  Data: <Database className="h-8 w-8" />,
  "Systems/DevOps": <Server className="h-8 w-8" />,
};

const TRACK_ICONS_SM: Record<TrackName, React.ReactNode> = {
  Cloud: <Cloud className="h-5 w-5" />,
  Security: <Shield className="h-5 w-5" />,
  Data: <Database className="h-5 w-5" />,
  "Systems/DevOps": <Server className="h-5 w-5" />,
};

type View = "intro" | "quiz" | "results";

const CareerMapping = () => {
  const [view, setView] = useState<View>("intro");
  const [currentSection, setCurrentSection] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [results, setResults] = useState<CareerResults | null>(null);

  const { data: existingAssessment, isLoading } = useCareerAssessment();
  const saveAssessment = useSaveAssessment();
  const deleteAssessment = useDeleteAssessment();

  // If a previous assessment exists, jump to results
  useEffect(() => {
    if (existingAssessment) {
      setResults(existingAssessment.results as unknown as CareerResults);
      setAnswers(existingAssessment.answers as unknown as Record<number, number>);
      setView("results");
    }
  }, [existingAssessment]);

  const sectionQuestions = QUESTIONS.filter(
    (q) => q.section === SECTIONS[currentSection]?.number
  );

  const allSectionAnswered = sectionQuestions.every((q) => answers[q.id] !== undefined);

  const handleAnswer = (questionId: number, value: number) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleNext = () => {
    if (currentSection < SECTIONS.length - 1) {
      setCurrentSection((s) => s + 1);
    } else {
      const computed = computeCareerResults(answers);
      setResults(computed);
      setView("results");

      saveAssessment.mutate(
        { answers, results: computed },
        {
          onSuccess: () => toast.success("Assessment saved!"),
          onError: () => toast.error("Failed to save assessment. Please try again."),
        }
      );
    }
  };

  const handleBack = () => {
    if (currentSection > 0) setCurrentSection((s) => s - 1);
  };

  const handleRetake = () => {
    if (existingAssessment?.id) {
      deleteAssessment.mutate(existingAssessment.id, {
        onError: () => toast.error("Failed to delete previous assessment."),
      });
    }
    setAnswers({});
    setResults(null);
    setCurrentSection(0);
    setView("intro");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-6 max-w-2xl flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-6 max-w-2xl">
        {view === "intro" && <IntroView onStart={() => setView("quiz")} />}

        {view === "quiz" && (
          <QuizView
            section={SECTIONS[currentSection]}
            sectionIndex={currentSection}
            totalSections={SECTIONS.length}
            questions={sectionQuestions}
            answers={answers}
            onAnswer={handleAnswer}
            onNext={handleNext}
            onBack={handleBack}
            allAnswered={allSectionAnswered}
            isLast={currentSection === SECTIONS.length - 1}
          />
        )}

        {view === "results" && results && (
          <ResultsView
            results={results}
            onRetake={handleRetake}
            isDeleting={deleteAssessment.isPending}
          />
        )}
      </div>
    </div>
  );
};

/* ─── Intro ─── */
const IntroView = ({ onStart }: { onStart: () => void }) => (
  <Card className="text-center">
    <CardHeader className="pb-2">
      <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
        <Compass className="h-8 w-8 text-primary" />
      </div>
      <h1 className="text-2xl font-bold">Career Mapping</h1>
      <p className="text-muted-foreground mt-2 max-w-md mx-auto">
        Discover which tech career track aligns best with your skills and interests.
        Answer 16 quick statements across 4 sections — it takes about 3 minutes.
      </p>
    </CardHeader>
    <CardContent className="space-y-4 pb-2 my-[20px]">
      <div className="grid grid-cols-2 gap-3 text-left max-w-sm mx-auto">
        {SECTIONS.map((s) => (
          <div key={s.number} className="flex items-center gap-2 text-sm">
            <Badge variant="secondary" className="h-6 w-6 p-0 flex items-center justify-center text-xs">
              {s.number}
            </Badge>
            <span className="text-muted-foreground">{s.title}</span>
          </div>
        ))}
      </div>
    </CardContent>
    <CardFooter className="justify-center pt-4">
      <Button size="lg" onClick={onStart}>
        Start Assessment
      </Button>
    </CardFooter>
  </Card>
);

/* ─── Quiz ─── */
interface QuizViewProps {
  section: (typeof SECTIONS)[number];
  sectionIndex: number;
  totalSections: number;
  questions: typeof QUESTIONS;
  answers: Record<number, number>;
  onAnswer: (id: number, value: number) => void;
  onNext: () => void;
  onBack: () => void;
  allAnswered: boolean;
  isLast: boolean;
}

const QuizView = ({
  section,
  sectionIndex,
  totalSections,
  questions,
  answers,
  onAnswer,
  onNext,
  onBack,
  allAnswered,
  isLast,
}: QuizViewProps) => {
  const progress = ((sectionIndex + 1) / totalSections) * 100;

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>Section {sectionIndex + 1} of {totalSections}</span>
          <span>{section.title}</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      <Card>
        <CardHeader className="pb-3">
          <h2 className="text-xl font-semibold">{section.title}</h2>
          <p className="text-sm text-muted-foreground">{section.description}</p>
        </CardHeader>
        <CardContent className="space-y-6">
          {questions.map((q) => (
            <div key={q.id} className="space-y-3">
              <p className="text-sm font-medium leading-relaxed">
                {q.id}. {q.statement}
              </p>
              <RadioGroup
                value={answers[q.id]?.toString()}
                onValueChange={(val) => onAnswer(q.id, parseInt(val))}
                className="flex flex-wrap gap-2"
              >
                {LIKERT_OPTIONS.map((opt) => (
                  <div key={opt.value} className="flex items-center gap-1.5">
                    <RadioGroupItem value={opt.value.toString()} id={`q${q.id}-${opt.value}`} />
                    <Label htmlFor={`q${q.id}-${opt.value}`} className="text-xs cursor-pointer">
                      {opt.label}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
              {q.id !== questions[questions.length - 1].id && <Separator />}
            </div>
          ))}
        </CardContent>
        <CardFooter className="flex justify-between pt-4">
          <Button variant="outline" onClick={onBack} disabled={sectionIndex === 0} className="gap-2">
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
          <Button onClick={onNext} disabled={!allAnswered} className="gap-2">
            {isLast ? "See My Results" : "Next"}{" "}
            {!isLast && <ArrowRight className="h-4 w-4" />}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

/* ─── Results ─── */
const ResultsView = ({
  results,
  onRetake,
  isDeleting,
}: {
  results: CareerResults;
  onRetake: () => void;
  isDeleting: boolean;
}) => {
  const primary = results.tracks[0];
  const secondary = results.tracks[1];

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold">Your Career Match</h1>
        <p className="text-muted-foreground mt-1">Based on your skills, experience, and preferences</p>
      </div>

      {/* Primary Match */}
      <Card className="border-primary/30 bg-primary/5">
        <CardHeader className="text-center pb-2">
          <Badge className="mx-auto mb-2 w-fit">Primary Match</Badge>
          <div className="mx-auto mb-2 w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            {TRACK_ICONS[primary.name]}
          </div>
          <h2 className="text-xl font-bold">{primary.name}</h2>
          <p className="text-3xl font-bold text-primary">{primary.percentage}%</p>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center">
            {TRACK_META[primary.name].description}
          </p>
        </CardContent>
      </Card>

      {/* Secondary Match */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
              {TRACK_ICONS_SM[secondary.name]}
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <div>
                  <Badge variant="secondary" className="mb-1">Secondary Match</Badge>
                  <h3 className="font-semibold">{secondary.name}</h3>
                </div>
                <span className="text-lg font-bold">{secondary.percentage}%</span>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">
            {TRACK_META[secondary.name].description}
          </p>
        </CardContent>
      </Card>

      {/* Readiness Score */}
      <Card>
        <CardHeader className="pb-2">
          <h3 className="font-semibold">Readiness Score</h3>
          <p className="text-xs text-muted-foreground">
            How prepared you are based on your technical foundation, AI exposure, and market readiness.
          </p>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Overall Readiness</span>
            <span className="font-semibold">{results.readiness}%</span>
          </div>
          <Progress value={results.readiness} className="h-3" />
        </CardContent>
      </Card>

      {/* Full Breakdown */}
      <Card>
        <CardHeader className="pb-2">
          <h3 className="font-semibold">All Track Scores</h3>
        </CardHeader>
        <CardContent className="space-y-4">
          {results.tracks.map((track) => (
            <div key={track.name} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">{TRACK_ICONS_SM[track.name]}</span>
                  <span>{track.name}</span>
                </div>
                <span className="font-medium">{track.percentage}%</span>
              </div>
              <Progress value={track.percentage} className="h-2" />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* AI Roadmap */}
      <RoadmapSection results={results} />


      {/* Retake */}
      <div className="text-center">
        <Button variant="outline" onClick={onRetake} disabled={isDeleting} className="gap-2">
          {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
          Retake Assessment
        </Button>
      </div>
    </div>
  );
};

/* ─── AI Roadmap ─── */
const RoadmapSection = ({ results }: { results: CareerResults }) => {
  const [roadmap, setRoadmap] = useState<CareerRoadmap | null>(null);
  const generate = useGenerateRoadmap();

  const handleGenerate = () => {
    generate.mutate(results, {
      onSuccess: (data) => setRoadmap(data),
      onError: (e: Error) => toast.error(e.message),
    });
  };

  return (
    <Card className="border-accent/30">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-semibold flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-accent" />
              Your AI Roadmap
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              A personalized plan for breaking into {results.tracks[0].name} — generated from your results.
            </p>
          </div>
          {roadmap && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleGenerate}
              disabled={generate.isPending}
              className="gap-1.5 shrink-0"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${generate.isPending ? "animate-spin" : ""}`} />
              Regenerate
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {!roadmap && (
          <Button onClick={handleGenerate} disabled={generate.isPending} className="w-full gap-2">
            {generate.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Building your roadmap…
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" /> Generate My Roadmap
              </>
            )}
          </Button>
        )}

        {roadmap && (
          <>
            <p className="text-sm text-muted-foreground leading-relaxed">{roadmap.summary}</p>

            {/* Phases */}
            <div className="space-y-4">
              {roadmap.phases.map((phase, i) => (
                <div key={i} className="relative pl-6">
                  <span className="absolute left-0 top-1 h-2.5 w-2.5 rounded-full bg-primary" />
                  {i !== roadmap.phases.length - 1 && (
                    <span className="absolute left-[4px] top-4 bottom-[-16px] w-px bg-border" />
                  )}
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="font-semibold text-sm">{phase.title}</h4>
                    <Badge variant="secondary" className="text-[10px]">{phase.timeframe}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{phase.focus}</p>
                  <ul className="mt-2 space-y-1.5">
                    {phase.actions.map((a, j) => (
                      <li key={j} className="flex gap-2 text-sm">
                        <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 shrink-0 text-primary" />
                        <span className="text-muted-foreground">{a}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <Separator />

            {/* Skills */}
            <div>
              <h4 className="text-sm font-semibold mb-2">Skills to build</h4>
              <div className="flex flex-wrap gap-1.5">
                {roadmap.skills.map((s) => (
                  <Badge key={s} variant="secondary">{s}</Badge>
                ))}
              </div>
            </div>

            {/* Projects */}
            <div>
              <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                <FolderGit2 className="h-4 w-4 text-muted-foreground" /> Portfolio projects
              </h4>
              <div className="space-y-2">
                {roadmap.projects.map((p) => (
                  <div key={p.title} className="rounded-lg border p-3">
                    <p className="text-sm font-medium">{p.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{p.description}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Certifications + Roles */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                  <Award className="h-4 w-4 text-muted-foreground" /> Certifications
                </h4>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  {roadmap.certifications.map((c) => (
                    <li key={c}>• {c}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                  <Target className="h-4 w-4 text-muted-foreground" /> Roles to target
                </h4>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  {roadmap.roles.map((r) => (
                    <li key={r}>• {r}</li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Detailed Job Descriptions */}
            {roadmap.jobDescriptions && roadmap.jobDescriptions.length > 0 && (
              <div className="space-y-4">
                <h4 className="text-sm font-semibold flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-muted-foreground" /> Best-fit job descriptions
                </h4>
                <div className="grid gap-4 sm:grid-cols-2">
                  {roadmap.jobDescriptions.map((job) => (
                    <div key={job.title} className="rounded-lg border p-4 space-y-2.5">
                      <div className="flex items-start justify-between gap-2">
                        <h5 className="font-medium text-sm">{job.title}</h5>
                        <Badge variant="outline" className="text-[10px] shrink-0">
                          <DollarSign className="h-3 w-3 mr-0.5" />
                          {job.salaryRange}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">{job.summary}</p>
                      <p className="text-xs text-foreground leading-relaxed">{job.description}</p>
                      <div className="text-xs leading-relaxed">
                        <span className="font-medium">Why it fits:</span>{" "}
                        <span className="text-muted-foreground">{job.whyItFits}</span>
                      </div>
                      <ul className="space-y-1 text-xs text-muted-foreground">
                        {job.keyResponsibilities.map((r, idx) => (
                          <li key={idx}>• {r}</li>
                        ))}
                      </ul>
                      <p className="text-[10px] text-muted-foreground">
                        Time to qualified: {job.timeToQualified}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default CareerMapping;

