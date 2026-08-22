import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const FROM_ADDRESS =
  Deno.env.get("NOTIFICATION_FROM_EMAIL") ?? "notifications@nextgencollar.com";
const FROM = `NextGen Collar <${FROM_ADDRESS}>`;
const REPLY_TO = Deno.env.get("NOTIFICATION_REPLY_TO") ?? "support@nextgencollar.com";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

function toPlainText(html: string): string {
  return html
    .replace(/<a [^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi, "$2 ($1)")
    .replace(/<\/(p|div|h1|h2|h3|li|tr)>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .split("\n")
    .map((l) => l.trim())
    .join("\n")
    .trim();
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => null);
    const recruiterId: string | undefined = body?.recruiterId;
    const status: string | undefined = body?.status;
    const note: string | undefined = body?.note;

    const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!recruiterId || !uuidRe.test(recruiterId)) {
      return json({ error: "A valid recruiterId is required" }, 400);
    }
    if (status !== "approved" && status !== "rejected") {
      return json({ error: "status must be 'approved' or 'rejected'" }, 400);
    }

    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) {
      return json({ error: "Missing authorization header" }, 401);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const admin = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    // Validate the caller's JWT
    const token = authHeader.replace("Bearer ", "");
    const { data: callerData, error: callerError } = await admin.auth.getUser(token);
    const caller = callerData?.user;
    if (callerError || !caller) {
      return json({ error: "Not authenticated" }, 401);
    }

    // Only admins may change recruiter status
    const { data: isAdmin, error: roleError } = await admin.rpc("has_role", {
      _user_id: caller.id,
      _role: "admin",
    });
    if (roleError) {
      console.error("Role check failed:", roleError.message);
      return json({ error: "Could not verify permissions" }, 500);
    }
    if (!isAdmin) {
      return json({ error: "Admins only" }, 403);
    }

    // Load the recruiter profile
    const { data: recruiter, error: profileError } = await admin
      .from("profiles")
      .select("id, full_name, profile_type, company_name, recruiter_status")
      .eq("id", recruiterId)
      .maybeSingle();

    if (profileError || !recruiter) {
      return json({ error: "Recruiter profile not found" }, 404);
    }
    if (recruiter.profile_type !== "recruiter") {
      return json({ error: "This profile is not a recruiter account" }, 400);
    }

    // Apply the status change (service role bypasses the admin-only trigger guard)
    const { data: updated, error: updateError } = await admin
      .from("profiles")
      .update({
        recruiter_status: status,
        is_verified_recruiter: status === "approved",
      })
      .eq("id", recruiterId)
      .select("recruiter_status, is_verified_recruiter")
      .maybeSingle();

    if (updateError) {
      console.error("Status update failed:", updateError.message);
      return json({ error: `Could not update status: ${updateError.message}` }, 500);
    }

    // Guard against a silent revert (e.g. a BEFORE UPDATE trigger rolling the value back)
    if (!updated || updated.recruiter_status !== status) {
      console.error(
        `Status did not persist for ${recruiterId}: expected ${status}, got ${updated?.recruiter_status ?? "no row"}`,
      );
      return json(
        {
          error:
            "The status change did not persist in the database. No email was sent. Please try again or contact support.",
        },
        500,
      );
    }


    // Resolve the recruiter's login email server-side
    const { data: authUser } = await admin.auth.admin.getUserById(recruiterId);
    const recipientEmail = authUser?.user?.email ?? null;

    if (!recipientEmail) {
      return json({
        success: true,
        status,
        emailSent: false,
        emailError: "No email address on file for this recruiter",
      });
    }

    const appUrl = Deno.env.get("APP_URL") ?? "https://nextgencollar.com";
    const name = recruiter.full_name || "there";
    const company = recruiter.company_name ? ` at ${recruiter.company_name}` : "";

    const subject =
      status === "approved"
        ? "Your NextGen Collar recruiter account is approved"
        : "Update on your NextGen Collar recruiter account";

    const html =
      status === "approved"
        ? `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="margin-top:0;">You're approved</h2>
        <p>Hi ${name},</p>
        <p>Your recruiter account${company} has been verified by the NextGen Collar team. You now have full access to candidate discovery, direct messaging, and posting to the community feed.</p>
        ${note ? `<p style="background:#f4f6f8;padding:12px;border-radius:8px;">${note}</p>` : ""}
        <p><a href="${appUrl}/talent" style="display:inline-block;background:#1b4a63;color:#ffffff;padding:12px 20px;border-radius:8px;text-decoration:none;">Browse candidates</a></p>
        <p style="color:#666;font-size:13px;">Questions? Just reply to this email.</p>
      </div>`
        : `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="margin-top:0;">Recruiter account not approved</h2>
        <p>Hi ${name},</p>
        <p>After review, your recruiter account${company} wasn't approved at this time, so recruiter features stay locked on your account.</p>
        ${note ? `<p style="background:#f4f6f8;padding:12px;border-radius:8px;">${note}</p>` : ""}
        <p>If you believe this was a mistake, or you'd like to resubmit with updated company details, reply to this email and our team will take another look.</p>
        <p style="color:#666;font-size:13px;">— The NextGen Collar team</p>
      </div>`;

    const emailResponse = await resend.emails.send({
      from: FROM,
      to: recipientEmail,
      reply_to: REPLY_TO,
      subject,
      html,
      text: toPlainText(html),
    });

    const sendError = (emailResponse as any)?.error;
    const emailId = (emailResponse as any)?.data?.id ?? null;

    if (sendError) {
      console.error("Resend send failed:", JSON.stringify(sendError));
    }

    await admin.from("email_logs").insert({
      user_id: recruiterId,
      recipient_email: recipientEmail,
      notification_type: status === "approved" ? "recruiter_approved" : "recruiter_rejected",
      subject,
      status: sendError ? "failed" : "sent",
      error_message: sendError ? (sendError.message ?? JSON.stringify(sendError)) : null,
      sent_at: sendError ? null : new Date().toISOString(),
    });

    return json({
      success: true,
      status,
      emailSent: !sendError,
      emailId,
      emailError: sendError ? (sendError.message ?? "Email delivery failed") : null,
    });
  } catch (error) {
    console.error("recruiter-status error:", error);
    return json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      500,
    );
  }
});
