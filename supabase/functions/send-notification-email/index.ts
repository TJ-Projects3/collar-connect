import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));


serve(async (req) => {
  try {
    const { notificationId } = await req.json();

    if (!notificationId) {
      return new Response(
        JSON.stringify({ error: "Missing notificationId" }),
        { status: 400 }
      );
    }

    // Create Supabase admin client
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Fetch notification
    const { data: notification, error: notifError } = await supabase
      .from("notifications")
      .select("*")
      .eq("id", notificationId)
      .single();

    if (notifError || !notification) {
      return new Response(
        JSON.stringify({ error: "Notification not found" }),
        { status: 404 }
      );
    }

    // Fetch recipient email
    const { data: recipient } = await supabase.auth.admin.getUserById(
      notification.user_id
    );

    if (!recipient?.user?.email) {
      return new Response(
        JSON.stringify({ error: "Recipient email not found" }),
        { status: 400 }
      );
    }

    // Fetch user's email preferences (default to true if not found)
    const { data: preferences } = await supabase
      .from("email_preferences")
      .select("email_on_message, email_on_connection_request, email_on_connection_accepted")
      .eq("user_id", notification.user_id)
      .single();

    // Check if user wants emails for this notification type
    const preferencesMap: Record<string, boolean> = {
      message: preferences?.email_on_message ?? true,
      connection_request: preferences?.email_on_connection_request ?? true,
      connection_accepted: preferences?.email_on_connection_accepted ?? true,
    };

    const shouldSendEmail = preferencesMap[notification.type] ?? true;

    if (!shouldSendEmail) {
      // User has disabled notifications for this type
      return new Response(
        JSON.stringify({ message: "Email notification disabled by user" }),
        { status: 200 }
      );
    }

    // Fetch sender profile
    let senderName = "Someone";

    if (notification.sender_id) {
      const { data: senderProfile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", notification.sender_id)
        .single();

      if (senderProfile?.full_name) {
        senderName = senderProfile.full_name;
      }
    }

    // Build email content
    let subject = "";
    let html = "";

    const appUrl = Deno.env.get("APP_URL");

    if (notification.type === "message") {
      subject = `New message from ${senderName}`;
      html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2>You have a new message</h2>
          <p><strong>${senderName}</strong> sent you a message.</p>
          <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p>${notification.body || notification.title}</p>
          </div>
          <p>
            <a href="${appUrl}/messages" style="display: inline-block; padding: 10px 20px; background-color: #0ea5e9; color: white; text-decoration: none; border-radius: 5px;">
              View Message
            </a>
          </p>
          <p style="color: #666; font-size: 12px; margin-top: 30px;">
            You received this email because you have email notifications enabled.
          </p>
        </div>
      `;
    } else if (notification.type === "connection_request") {
      subject = `${senderName} sent you a connection request`;
      html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2>New Connection Request</h2>
          <p><strong>${senderName}</strong> wants to connect with you.</p>
          <p>
            <a href="${appUrl}/notifications" style="display: inline-block; padding: 10px 20px; background-color: #0ea5e9; color: white; text-decoration: none; border-radius: 5px;">
              Review Request
            </a>
          </p>
          <p style="color: #666; font-size: 12px; margin-top: 30px;">
            You received this email because you have email notifications enabled.
          </p>
        </div>
      `;
    } else if (notification.type === "connection_accepted") {
      subject = `${senderName} accepted your connection request`;
      html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2>Connection Accepted 🎉</h2>
          <p>You are now connected with <strong>${senderName}</strong>.</p>
          <p>
            <a href="${appUrl}/profile/${notification.sender_id}" style="display: inline-block; padding: 10px 20px; background-color: #0ea5e9; color: white; text-decoration: none; border-radius: 5px;">
              View Profile
            </a>
          </p>
          <p style="color: #666; font-size: 12px; margin-top: 30px;">
            You received this email because you have email notifications enabled.
          </p>
        </div>
      `;
    }

    if (!subject) {
      return new Response(JSON.stringify({ message: "No email needed" }));
    }

    // Send email
    const emailResponse = await resend.emails.send({
      from: "NextGen Collar <onboarding@resend.dev>",
      to: recipient.user.email,
      subject,
      html,
    });

    // Log the email send
    await supabase.from("email_logs").insert({
      user_id: notification.user_id,
      recipient_email: recipient.user.email,
      notification_type: notification.type,
      notification_id: notificationId,
      subject,
      status: "sent",
      sent_at: new Date().toISOString(),
    });

    return new Response(
      JSON.stringify({ success: true, emailId: (emailResponse as any).id }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500 }
    );
  }
});
