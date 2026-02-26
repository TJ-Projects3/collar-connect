// Career Mapping – Scoring Logic
// 16 questions across 4 sections. Section 4 = 3x weight for track matching.

export type TrackName = "Cloud" | "Security" | "Data" | "Systems/DevOps";

export interface Question {
  id: number;
  section: number;
  sectionTitle: string;
  statement: string;
  /** Maps track name → weight multiplier. Empty = readiness-only. */
  trackWeights: Partial<Record<TrackName, number>>;
}

export interface TrackResult {
  name: TrackName;
  score: number;
  maxScore: number;
  percentage: number;
}

export interface CareerResults {
  tracks: TrackResult[]; // sorted descending by percentage
  readiness: number; // 0–100
}

export const TRACK_META: Record<
  TrackName,
  { description: string; icon: string; color: string }
> = {
  Cloud: {
    description:
      "You're drawn to building and scaling systems in the cloud — deploying apps, designing architectures, and leveraging cloud-native services.",
    icon: "Cloud",
    color: "hsl(var(--primary))",
  },
  Security: {
    description:
      "You have a passion for protecting systems and data — from threat analysis and compliance to identity management and secure coding.",
    icon: "Shield",
    color: "hsl(var(--accent))",
  },
  Data: {
    description:
      "You thrive on turning raw information into insight — through analytics, machine learning, data engineering, and visualization.",
    icon: "Database",
    color: "hsl(186 70% 45%)",
  },
  "Systems/DevOps": {
    description:
      "You love optimizing infrastructure, automating workflows, and keeping systems reliable — CI/CD, containers, and observability are your playground.",
    icon: "Server",
    color: "hsl(203 60% 36%)",
  },
};

export const QUESTIONS: Question[] = [
  // ── Section 1: Technical Foundation ──
  {
    id: 1,
    section: 1,
    sectionTitle: "Technical Foundation",
    statement: "I am comfortable integrating third-party APIs into applications.",
    trackWeights: { Cloud: 1, "Systems/DevOps": 1 },
  },
  {
    id: 2,
    section: 1,
    sectionTitle: "Technical Foundation",
    statement: "I have experience deploying applications to cloud platforms.",
    trackWeights: { Cloud: 1 },
  },
  {
    id: 3,
    section: 1,
    sectionTitle: "Technical Foundation",
    statement: "I understand fundamental security concepts like encryption and authentication.",
    trackWeights: { Security: 1 },
  },
  {
    id: 4,
    section: 1,
    sectionTitle: "Technical Foundation",
    statement: "I have built an end-to-end project (frontend, backend, and database).",
    trackWeights: { "Systems/DevOps": 1, Data: 1 },
  },

  // ── Section 2: AI Exposure ──
  {
    id: 5,
    section: 2,
    sectionTitle: "AI Exposure",
    statement: "I regularly use AI-powered tools (Copilot, ChatGPT, etc.) in my workflow.",
    trackWeights: { Data: 1, Cloud: 1 },
  },
  {
    id: 6,
    section: 2,
    sectionTitle: "AI Exposure",
    statement: "I can explain how AI impacts software architecture decisions.",
    trackWeights: { Cloud: 1, "Systems/DevOps": 1 },
  },
  {
    id: 7,
    section: 2,
    sectionTitle: "AI Exposure",
    statement: "I have worked with AI APIs or built AI-augmented workflows.",
    trackWeights: { Data: 1 },
  },
  {
    id: 8,
    section: 2,
    sectionTitle: "AI Exposure",
    statement: "I understand how AI changes system design and security considerations.",
    trackWeights: { "Systems/DevOps": 1, Security: 1 },
  },

  // ── Section 3: Market Readiness (readiness-only) ──
  {
    id: 9,
    section: 3,
    sectionTitle: "Market Readiness",
    statement: "My resume reflects current AI-era terminology and skills.",
    trackWeights: {},
  },
  {
    id: 10,
    section: 3,
    sectionTitle: "Market Readiness",
    statement: "I maintain an active GitHub or portfolio that showcases recent projects.",
    trackWeights: {},
  },
  {
    id: 11,
    section: 3,
    sectionTitle: "Market Readiness",
    statement: "I can clearly articulate the role I want and why I'm a fit for it.",
    trackWeights: {},
  },
  {
    id: 12,
    section: 3,
    sectionTitle: "Market Readiness",
    statement: "I know what differentiates my skillset from other candidates.",
    trackWeights: {},
  },

  // ── Section 4: Directional Preference (3x weight) ──
  {
    id: 13,
    section: 4,
    sectionTitle: "Directional Preference",
    statement: "I prefer building scalable, cloud-native systems and services.",
    trackWeights: { Cloud: 3 },
  },
  {
    id: 14,
    section: 4,
    sectionTitle: "Directional Preference",
    statement: "I prefer protecting and securing systems against threats.",
    trackWeights: { Security: 3 },
  },
  {
    id: 15,
    section: 4,
    sectionTitle: "Directional Preference",
    statement: "I prefer analyzing data and extracting actionable insights.",
    trackWeights: { Data: 3 },
  },
  {
    id: 16,
    section: 4,
    sectionTitle: "Directional Preference",
    statement: "I prefer optimizing infrastructure, CI/CD, and developer workflows.",
    trackWeights: { "Systems/DevOps": 3 },
  },
];

export const SECTIONS = [
  { number: 1, title: "Technical Foundation", description: "Evaluate your current technical skills and experience." },
  { number: 2, title: "AI Exposure", description: "How familiar are you with AI tools and their impact?" },
  { number: 3, title: "Market Readiness", description: "How prepared are you to compete in today's job market?" },
  { number: 4, title: "Directional Preference", description: "Which career direction excites you most?" },
];

export const LIKERT_OPTIONS = [
  { value: 1, label: "Strongly Disagree" },
  { value: 2, label: "Disagree" },
  { value: 3, label: "Neutral" },
  { value: 4, label: "Agree" },
  { value: 5, label: "Strongly Agree" },
] as const;

/**
 * Compute career track scores and readiness percentage from answers.
 * @param answers Record<questionId, likertValue (1–5)>
 */
export function computeCareerResults(
  answers: Record<number, number>
): CareerResults {
  const trackNames: TrackName[] = ["Cloud", "Security", "Data", "Systems/DevOps"];

  // Accumulate scores
  const scores: Record<TrackName, number> = {
    Cloud: 0,
    Security: 0,
    Data: 0,
    "Systems/DevOps": 0,
  };
  const maxScores: Record<TrackName, number> = {
    Cloud: 0,
    Security: 0,
    Data: 0,
    "Systems/DevOps": 0,
  };

  for (const q of QUESTIONS) {
    const answer = answers[q.id] ?? 3; // default neutral
    for (const [track, weight] of Object.entries(q.trackWeights) as [TrackName, number][]) {
      scores[track] += answer * weight;
      maxScores[track] += 5 * weight; // max possible per question
    }
  }

  const tracks: TrackResult[] = trackNames
    .map((name) => ({
      name,
      score: scores[name],
      maxScore: maxScores[name],
      percentage: maxScores[name] > 0 ? Math.round((scores[name] / maxScores[name]) * 100) : 0,
    }))
    .sort((a, b) => b.percentage - a.percentage);

  // Readiness = average of Sections 1-3 answers (questions 1-12), as a percentage of max (5)
  const readinessQuestions = QUESTIONS.filter((q) => q.section <= 3);
  const readinessSum = readinessQuestions.reduce((sum, q) => sum + (answers[q.id] ?? 3), 0);
  const readiness = Math.round((readinessSum / (readinessQuestions.length * 5)) * 100);

  return { tracks, readiness };
}
