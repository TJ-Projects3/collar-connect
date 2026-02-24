# Email Notifications Implementation Guide

This document explains how to add email notifications to CollarConnect on top of existing in-app notifications.

## Overview

Email notifications will be triggered when:
- ✅ Someone sends you a message
- ✅ Someone sends you a connection request
- ✅ Someone accepts your connection request

Users can control email notification preferences in Settings.

## Architecture

### 1. Database Layer

**New Tables:**
- `email_preferences` - Stores user preferences for each notification type
- `email_logs` - Logs all sent emails for tracking and debugging

**Migration File:**
- [20260224_add_email_notifications.sql](../supabase/migrations/20260224_add_email_notifications.sql)

### 2. Frontend Layer

**New Hook:**
- `useEmailPreferences` - Fetch and update user email notification settings
- `useEmailLogs` - View email notification history

**New Component:**
- `EmailNotificationSettings` - UI for managing email preferences in Settings page

**Updated Hooks:**
- `useMessaging` - Triggers email on message send
- `useConnections` - Triggers email on connection request/accept

### 3. Backend/Email Sending

**Edge Function (Optional):**
- `send-notification-email` - Handles actual email sending via Resend or similar service

**Helper Utility:**
- `src/lib/email-notifications.ts` - Core functions for triggering emails

## Implementation Steps

### Step 1: Deploy Database Migration

Run this SQL in your Supabase SQL Editor:

```bash
# Files to run in order:
1. supabase/migrations/20260224_add_email_notifications.sql
2. supabase/migrations/20260224_add_get_user_email_function.sql
```

This creates:
- `email_preferences` table with default settings
- `email_logs` table for tracking
- Auto-creates preferences for new users via trigger

### Step 2: Generate Updated Types

After deploying migrations, regenerate Supabase types:

```bash
npx supabase gen types typescript --local > src/integrations/supabase/types.ts
```

### Step 3: Add Email Notification Settings to Settings Page

Update `src/pages/Settings.tsx`:

```typescript
import { EmailNotificationSettings } from "@/components/EmailNotificationSettings";

// Inside your settings tabs or sections:
export function Settings() {
  return (
    <div>
      {/* ... existing settings ... */}
      <EmailNotificationSettings />
    </div>
  );
}
```

### Step 4: Set Up Email Service (Resend Recommended)

1. Install Resend: `npm install resend` or `bunx add resend`
2. Get API key from https://resend.com
3. Add to Supabase Edge Function secrets:
   - `RESEND_API_KEY` - Your Resend API key
   - `APP_URL` - Your app URL (e.g., https://collar-connect.com)

### Step 5: Deploy Edge Function

The Edge Function is ready in `supabase/functions/send-notification-email/`. Deploy it:

```bash
supabase functions deploy send-notification-email
```

### Step 6: Enable Email Sending in Hooks

The hooks are already updated:
- `useMessaging.ts` - Calls `sendEmailNotification()` after sending a message
- `useConnections.ts` - Calls `sendEmailNotification()` after connection requests/accepts

## Usage

### User Perspective

1. Users go to Settings → Email Notifications
2. Toggle preferences for:
   - Message notifications
   - Connection request notifications
   - Connection accepted notifications
   - Email digest (daily/weekly summary)

3. Settings are saved to database
4. When actions happen, emails only send if preferences allow

### Developer Perspective

To send an email after an action:

```typescript
import { sendEmailNotification, getUserEmail } from "@/lib/email-notifications";

// Inside a hook or component:
const recipientEmail = await getUserEmail(userId);
if (recipientEmail) {
  await sendEmailNotification({
    notification_id: notificationId,
    user_id: userId,
    recipient_email: recipientEmail,
    sender_name: senderName,
    notification_type: "message", // or "connection_request", "connection_accepted"
    content: messageContent,
  });
}
```

## Email Templates

Predefined templates in Edge Function:
- **message** - User sends you a message
- **connection_request** - User sends connection request
- **connection_accepted** - User accepts your request

All templates include:
- Action-specific subject line
- Preview of the action/content
- CTA button to take action in app
- Link to update email preferences

## Monitoring & Debugging

### View Sent Emails

Use the `useEmailLogs` hook to show users their email history:

```typescript
import { useEmailLogs } from "@/hooks/useEmailPreferences";

const { data: logs } = useEmailLogs();
// logs contains: recipient_email, status, sent_at, error_message
```

### Check Email Logs in Supabase

Query `email_logs` table:
```sql
SELECT * FROM email_logs WHERE status = 'failed' ORDER BY created_at DESC;
```

### Development Mode

In development (without Resend), emails are logged to console and marked as "pending":
```
Email notification would be sent: {
  notification_id: "...",
  user_id: "...",
  notification_type: "message",
  ...
}
```

## Troubleshooting

### Emails not sending?

1. Check if user enabled the notification type in Settings
2. Verify `RESEND_API_KEY` is set in Edge Function secrets
3. Check `email_logs` table for error messages
4. Verify user email is stored correctly in `auth.users`

### Users not receiving emails?

1. Check email spam folder
2. Verify email address in `auth.users` is correct
3. Check `email_preferences` table - prefer may be disabled
4. Check `email_logs` for delivery status

### Types not found?

1. Run migrations to create tables
2. Regenerate types: `npx supabase gen types typescript --local`
3. Restart TypeScript server in VS Code

## Future Enhancements

### Email Digest
- Batch notifications instead of individual emails
- Send daily or weekly summary
- Reduce email spam

### Schedule & Do Not Disturb
- Let users set quiet hours
- Pause notifications temporarily

### Notification Preferences
- Set different preferences per contact type
- Frequency limits (max X emails per day)

### Transactional Email Improvements
- Add unsubscribe links
- Track opens/clicks
- A/B test subject lines

## Database Schema

### email_preferences
```sql
id UUID PRIMARY KEY
user_id UUID (unique, references auth.users)
email_on_message BOOLEAN (default: true)
email_on_connection_request BOOLEAN (default: true)
email_on_connection_accepted BOOLEAN (default: true)
email_digest BOOLEAN (default: false)
digest_frequency TEXT ('daily' | 'weekly', default: 'daily')
created_at TIMESTAMP
updated_at TIMESTAMP
```

### email_logs
```sql
id UUID PRIMARY KEY
user_id UUID (references auth.users)
recipient_email TEXT
notification_type TEXT ('message' | 'connection_request' | 'connection_accepted')
notification_id UUID (references notifications)
subject TEXT
status TEXT ('pending' | 'sent' | 'failed')
error_message TEXT (null if successful)
sent_at TIMESTAMP (null if not sent)
created_at TIMESTAMP
```

## Security Considerations

- RLS enabled on both tables
- Users can only view their own preferences and logs
- System can insert/update logs
- Email addresses not exposed to other users
- Unsubscribe tokens recommended for production

## Files Modified/Created

### New Files
- `src/hooks/useEmailPreferences.ts` - Hook for managing email settings
- `src/components/EmailNotificationSettings.tsx` - UI component
- `src/lib/email-notifications.ts` - Helper utilities
- `supabase/migrations/20260224_add_email_notifications.sql` - Database schema
- `supabase/migrations/20260224_add_get_user_email_function.sql` - SQL function
- `supabase/functions/send-notification-email/index.ts` - Edge Function

### Modified Files
- `src/hooks/useMessaging.ts` - Triggers email on message send
- `src/hooks/useConnections.ts` - Triggers email on connection actions

