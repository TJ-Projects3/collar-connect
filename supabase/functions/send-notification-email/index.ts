import { createClient } from "@supabase/supabase-js";

interface NotificationEmailRequest {
  notification_id: string;
  user_id: string;
  recipient_email: string;
  sender_name: string;
  notification_type: string;
  content: string;
}

// Email templates
interface EmailData {
  sender_name: string;
  sender_id: string;
  content: string;
  sender_title?: string;
  app_url: string;
}

interface EmailTemplateResult {
  subject: string;
  html: string;
}

const emailTemplates: Record<string, (data: EmailData) => EmailTemplateResult> = {
  message: (data: EmailData) => ({
    subject: `${data.sender_name} sent you a message`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
        <h2>New Message from ${data.sender_name}</h2>
        <p>You have received a new message on CollarConnect:</p>
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p><em>"${data.content}"</em></p>
        </div>
        <p>
          <a href="${data.app_url}/messages?recipientId=${data.sender_id}" 
             style="display: inline-block; padding: 10px 20px; background-color: #0ea5e9; color: white; text-decoration: none; border-radius: 5px;">
            View Message
          </a>
        </p>
        <p style="color: #666; font-size: 12px; margin-top: 30px;">
          You received this email because you have email notifications enabled. 
          <a href="${data.app_url}/settings" style="color: #0ea5e9;">Update your preferences</a>
        </p>
      </div>
    `,
  }),
  
  connection_request: (data: EmailData) => ({
    subject: `${data.sender_name} sent you a connection request`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
        <h2>New Connection Request</h2>
        <p>${data.sender_name} wants to connect with you on CollarConnect.</p>
        <p style="color: #666; margin-top: 20px; font-size: 14px;">
          Their profile:
        </p>
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p><strong>${data.sender_name}</strong></p>
          <p style="color: #666; margin: 5px 0;">${data.sender_title || 'Professional'}</p>
        </div>
        <p>
          <a href="${data.app_url}/notifications" 
             style="display: inline-block; padding: 10px 20px; background-color: #0ea5e9; color: white; text-decoration: none; border-radius: 5px;">
            View Request
          </a>
        </p>
        <p style="color: #666; font-size: 12px; margin-top: 30px;">
          You received this email because you have email notifications enabled. 
          <a href="${data.app_url}/settings" style="color: #0ea5e9;">Update your preferences</a>
        </p>
      </div>
    `,
  }),
  
  connection_accepted: (data: EmailData) => ({
    subject: `${data.sender_name} accepted your connection request`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
        <h2>Connection Accepted!</h2>
        <p>${data.sender_name} has accepted your connection request on CollarConnect.</p>
        <p>
          <a href="${data.app_url}/my-network" 
             style="display: inline-block; padding: 10px 20px; background-color: #0ea5e9; color: white; text-decoration: none; border-radius: 5px;">
            View Your Network
          </a>
        </p>
        <p style="color: #666; font-size: 12px; margin-top: 30px;">
          You received this email because you have email notifications enabled. 
          <a href="${data.app_url}/settings" style="color: #0ea5e9;">Update your preferences</a>
        </p>
      </div>
    `,
  }),
};

export async function sendNotificationEmail(req: Request): Promise<Response> {
  try {
    const data: NotificationEmailRequest = await req.json();

    // Validate required fields
    if (!data.notification_id || !data.recipient_email || !data.sender_name) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Get template
    const templateFn = emailTemplates[data.notification_type];
    if (!templateFn) {
      console.warn(`Unknown notification type: ${data.notification_type}`);
      return new Response(
        JSON.stringify({ error: "Invalid notification type" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const appUrl = (globalThis as any).Deno?.env?.get?.("APP_URL") || "https://collar-connect.com";
    
    const emailTemplate = templateFn({
      sender_name: data.sender_name,
      sender_id: data.user_id,
      content: data.content,
      sender_title: data.sender_name, // Could fetch this from profile
      app_url: appUrl,
    });

    // Send email using Supabase's ResendJS integration or your preferred service
    const resendApiKey = (globalThis as any).Deno?.env?.get?.("RESEND_API_KEY");
    
    if (!resendApiKey) {
      console.error("RESEND_API_KEY not configured");
      // For development, just log and mark as sent
      return new Response(
        JSON.stringify({
          message: "Email queued (no provider configured)",
          logged: true,
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    // Call Resend API
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "noreply@collar-connect.com",
        to: data.recipient_email,
        subject: emailTemplate.subject,
        html: emailTemplate.html,
      }),
    });

    const emailResult = await emailResponse.json();

    if (!emailResponse.ok) {
      console.error("Email send failed:", emailResult);
      throw new Error(`Email service error: ${emailResult.message}`);
    }

    // Log the email send
    const supabase = createClient(
      (globalThis as any).Deno?.env?.get?.("SUPABASE_URL") || "",
      (globalThis as any).Deno?.env?.get?.("SUPABASE_SERVICE_ROLE_KEY") || ""
    );

    await supabase.from("email_logs").insert({
      user_id: data.user_id,
      recipient_email: data.recipient_email,
      notification_type: data.notification_type,
      notification_id: data.notification_id,
      subject: emailTemplate.subject,
      status: "sent",
      sent_at: new Date().toISOString(),
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: "Email sent successfully",
        email_id: emailResult.id,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error sending notification email:", error);

    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
