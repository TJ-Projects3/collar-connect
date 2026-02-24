import { supabase } from "@/integrations/supabase/client";

interface EmailNotificationOptions {
  notification_id?: string;
  user_id: string; // recipient of the notification
  recipient_email: string;
  sender_name: string;
  notification_type: "message" | "connection_request" | "connection_accepted";
  title: string; // matches notifications.title
  body: string; // matches notifications.body
}

/**
 * Sends an email notification if the user has enabled it in their preferences
 * This function should be called from hooks when notifications are created
 */
export async function sendEmailNotification(options: EmailNotificationOptions) {
  try {
    // For now, this logs the intent. In production, you would:
    // 1. Call your backend API / Edge Function
    // 2. Use a service like Resend, SendGrid, or AWS SES
    console.log("Email notification would be sent:", options);

    // Example of how to call an Edge Function (when ready):
    // const response = await fetch(
    //   `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-notification-email`,
    //   {
    //     method: "POST",
    //     headers: {
    //       "Content-Type": "application/json",
    //     },
    //     body: JSON.stringify(options),
    //   }
    // );

    // For development, we'll just log this to console
    return true;
  } catch (error) {
    console.error("Error in sendEmailNotification:", error);
    // Don't throw - we don't want email failures to break the app
    return false;
  }
}

/**
 * Gets the recipient's email from auth.users table
 */
export async function getUserEmail(userId: string): Promise<string | null> {
  try {
    // Query auth.users directly (if RLS allows), or fetch from a view
    const { data, error } = await supabase.auth.admin?.getUserById(userId) || 
      await supabase.from("profiles").select("id").eq("id", userId);
    
    if (error) {
      console.error("Error fetching user email:", error);
      return null;
    }
    
    // Since we can't directly access auth.users from client, 
    // we might need to store email preference with email in a separate column in profiles
    return null;
  } catch (error) {
    console.error("Error in getUserEmail:", error);
    return null;
  }
}
