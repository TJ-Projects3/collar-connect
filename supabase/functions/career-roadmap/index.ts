import { generateText, Output } from "npm:ai";
import { z } from "npm:zod";
import { createLovableAiGatewayProvider } from "../_shared/ai-gateway.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const roadmapSchema = z.object({
  summary: z.string(),
  phases: z.array(
    z.object({
      title: z.string(),
      timeframe: z.string(),
      focus: z.string(),
      actions: z.array(z.string()),
    })
  ),
  skills: z.array(z.string()),
  projects: z.array(z.object({ title: z.string(), description: z.string() })),
  certifications: z.array(z.string()),
  roles: z.array(z.string()),
  jobDescriptions: z.array(
    z.object({
      title: z.string(),
      summary: z.string(),
      description: z.string(),
      whyItFits: z.string(),
      keyResponsibilities: z.array(z.string()),
      salaryRange: z.string(),
      timeToQualified: z.string(),
    })
  ).max(4),
});

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const key = Deno.env.get("LOVABLE_API_KEY");
    if (!key) {
      return new Response(JSON.stringify({ error: "Missing LOVABLE_API_KEY" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { primaryTrack, secondaryTrack, readiness, trackScores } =
      await req.json();

    const gateway = createLovableAiGatewayProvider(key);

    const { output } = await generateText({
      model: gateway("openai/gpt-5.6-sol"),
      output: Output.object({ schema: roadmapSchema }),
      providerOptions: { lovable: { reasoningEffort: "none" } },
      system:
        "You are a senior tech career coach for early-career talent breaking into cloud, security, data, and DevOps roles. Give concrete, current, AI-era advice. Be specific: name real tools, certifications, and project ideas. Keep every string short and scannable.",
      prompt: `Create a personalized 6-month career roadmap and recommend matching job descriptions.

Primary track: ${primaryTrack}
Secondary track: ${secondaryTrack}
Overall readiness score: ${readiness}/100
Track scores: ${JSON.stringify(trackScores)}

Requirements:
- summary: 2 sentences on where this person stands and what to prioritize.
- phases: exactly 3 phases (e.g. "Days 1-30", "Months 2-3", "Months 4-6"), each with 3-4 concrete actions.
- skills: 6 skills to build, ordered by priority.
- projects: 3 portfolio project ideas with one-sentence descriptions.
- certifications: 3 relevant certifications.
- roles: 4 job titles to target.
- jobDescriptions: For each role above, write a detailed job description (2-3 sentences), why it fits this specific candidate, 3 key responsibilities, a realistic US salary range, and an estimated time to become qualified. Calibrate ambition and salary to the readiness score and primary track.
Calibrate ambition to the readiness score.`,
    });

    return new Response(JSON.stringify(output), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    const status = message.includes("429")
      ? 429
      : message.includes("402")
        ? 402
        : 500;
    return new Response(JSON.stringify({ error: message }), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

