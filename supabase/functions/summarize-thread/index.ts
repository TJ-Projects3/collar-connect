import { streamText, Output } from "npm:ai";
import { z } from "npm:zod";
import { createClient } from "npm:@supabase/supabase-js@2";
import { createLovableAiGatewayProvider } from "../_shared/ai-gateway.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const summarySchema = z.object({
  bullets: z.array(z.string()).length(3),
  takeaway: z.string(),
});

const clamp = (s: string, max: number) =>
  s.length > max ? `${s.slice(0, max)}…` : s;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const key = Deno.env.get("LOVABLE_API_KEY");
    if (!key) return json({ error: "Missing LOVABLE_API_KEY" }, 500);

    // Validate the caller's JWT in code (verify_jwt is disabled by default).
    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace("Bearer ", "").trim();
    if (!token) return json({ error: "Not authenticated" }, 401);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
    );
    const { data: userData, error: userErr } = await supabase.auth.getUser(token);
    if (userErr || !userData?.user) {
      return json({ error: "Not authenticated" }, 401);
    }

    const body = await req.json().catch(() => null);
    const parsed = z
      .object({
        title: z.string().min(1).max(500),
        question: z.string().max(10000).optional().default(""),
        answers: z.array(z.string().max(10000)).min(1).max(60),
      })
      .safeParse(body);

    if (!parsed.success) {
      return json({ error: parsed.error.flatten().fieldErrors }, 400);
    }

    const { title, question, answers } = parsed.data;

    // Keep the prompt inside a safe token budget.
    let budget = 24000;
    const replies: string[] = [];
    for (const a of answers) {
      const text = clamp(a.trim(), 1500);
      if (budget - text.length <= 0) break;
      budget -= text.length;
      replies.push(text);
    }

    const gateway = createLovableAiGatewayProvider(key);

    const result = streamText({
      model: gateway("openai/gpt-5.6-sol"),
      output: Output.object({ schema: summarySchema }),
      providerOptions: { lovable: { reasoningEffort: "none" } },
      system:
        "You summarize community Q&A discussions for early-career tech talent. Be neutral, concrete, and concise. Never name, guess at, or describe the identity of any participant — refer only to what was said. Do not invent facts that are not in the thread.",
      prompt: `Summarize this discussion thread into an executive summary.

Question title: ${title}
Question detail: ${clamp(question, 4000) || "(none)"}

Replies (${replies.length}):
${replies.map((r, i) => `${i + 1}. ${r}`).join("\n")}

Requirements:
- bullets: exactly 3 bullets. Bullet 1 = what is being asked / the core problem. Bullet 2 = the main advice or consensus in the replies. Bullet 3 = notable disagreements, caveats, or open questions. Each bullet max 200 characters, no leading dashes.
- takeaway: one sentence (max 140 characters) on the single most actionable next step.`,
    });

    const output = await result.output;

    return json({ bullets: output.bullets, takeaway: output.takeaway });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("summarize-thread failed:", message);
    const status = /402|credit/i.test(message)
      ? 402
      : /429|rate limit/i.test(message)
        ? 429
        : 500;
    return json({ error: message }, status);
  }
});
