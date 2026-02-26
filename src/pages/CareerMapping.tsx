import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Navbar } from "@/components/Navbar";
import { Compass, Cloud, Shield, Database, Server, ArrowLeft, ArrowRight, RotateCcw, Loader2 } from "lucide-react";
import { toast } from "sonner";
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

export default CareerMapping;
