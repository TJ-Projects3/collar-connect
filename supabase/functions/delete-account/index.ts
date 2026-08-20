import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace(/^Bearer\s+/i, "").trim();
    if (!token) return json({ error: "Missing authorization token" }, 401);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Identity always comes from the verified token, never from the request body.
    const { data: userData, error: userError } = await admin.auth.getUser(token);
    const user = userData?.user;
    if (userError || !user) {
      return json({ error: "Invalid or expired session" }, 401);
    }

    // Content that isn't wired to a cascading foreign key is removed explicitly.
    await admin.from("post_likes").delete().eq("user_id", user.id);
    await admin.from("post_replies").delete().eq("author_id", user.id);
    await admin.from("posts").delete().eq("author_id", user.id);
    await admin.from("question_votes").delete().eq("user_id", user.id);
    await admin.from("question_answers").delete().eq("author_id", user.id);
    await admin.from("questions").delete().eq("author_id", user.id);
    await admin.from("student_projects").delete().eq("user_id", user.id);
    await admin.from("blocked_users").delete().eq("blocker_id", user.id);
    await admin.from("blocked_users").delete().eq("blocked_id", user.id);

    const { error: deleteError } = await admin.auth.admin.deleteUser(user.id);
    if (deleteError) {
      console.error(`Account deletion failed for ${user.id}: ${deleteError.message}`);
      return json({ error: "Account deletion failed", details: deleteError.message }, 500);
    }

    console.log(`Account deleted: ${user.id}`);
    return json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("delete-account error:", message);
    return json({ error: "Unexpected error", details: message }, 500);
  }
});
