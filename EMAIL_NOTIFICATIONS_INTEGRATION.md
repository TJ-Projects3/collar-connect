# Email Notifications Implementation Guide

**Updated for your exact schema** - Using existing `notifications` table with `title`/`body` fields.

## Overview

Email notifications layer on top of your existing in-app notification system:

1. ✅ **Existing:** Notifications table stores in-app alerts (title, body, sender_id)
2. ✅ **Existing:** Messages and connection triggers create notifications
3. ✅ **Existing:** Frontend displays these in-app
4. **NEW:** Email preferences table - User opt-in/opt-out settings
5. **NEW:** Email logs table - Track all sent emails
6. **NEW:** Backend service - Sends actual emails via Resend/SendGrid

## Your Database Schema

### notifications (existing - unchanged)
```sql
id UUID PRIMARY KEY
user_id UUID - recipient of notification
sender_id UUID - who triggered it (can be NULL)
type TEXT - 'message', 'connection_request', 'connection_accepted'
title TEXT - Used as email subject
body TEXT - Used as email preview/content
reference_id UUID - Links to related record
is_read BOOLEAN
created_at TIMESTAMP
```

### messages (existing - unchanged)
```sql
sender_id UUID
recipient_id UUID
content TEXT
conversation_id UUID
-- Triggers: after_message_insert_update_conversation, trigger_notify_on_message
```

### email_preferences (NEW)
```sql
id UUID PRIMARY KEY
user_id UUID (UNIQUE) - References auth.users
email_on_message BOOLEAN DEFAULT true
email_on_connection_request BOOLEAN DEFAULT true
email_on_connection_accepted BOOLEAN DEFAULT true
email_digest BOOLEAN DEFAULT false
digest_frequency TEXT - 'daily' or 'weekly'
created_at TIMESTAMP
updated_at TIMESTAMP
```

### email_logs (NEW)
```sql
id UUID PRIMARY KEY
user_id UUID - References auth.users (recipient)
recipient_email TEXT - Actual email address
notification_type TEXT - 'message', 'connection_request', etc.
notification_id UUID - References notifications(id)
subject TEXT - From notifications.title
status TEXT - 'pending', 'sent', or 'failed'
error_message TEXT
sent_at TIMESTAMP
created_at TIMESTAMP
```

## Architecture

```
User Action
    ↓
DB Trigger (existing)
    ↓
Create Notification (in notifications table)
    ↓
NEW: Trigger fires on notification INSERT
    ↓
NEW: Edge Function called
    ↓
NEW: Check email_preferences
    ↓
IF user enabled → Get email from auth.users → Send via Resend/SendGrid
    ↓
NEW: Log result in email_logs
```

## Implementation Steps

### Step 1: Deploy Database Migrations

Run these in Supabase SQL Editor:

**File 1:** `supabase/migrations/20260224_add_email_notifications.sql`
- Creates `email_preferences` table with RLS
- Creates `email_logs` table with RLS
- Creates trigger to auto-create preferences for new users
- Creates indexes

**File 2:** `supabase/migrations/20260224_add_get_user_email_function.sql`
- Creates RPC function to retrieve email from auth.users (if needed)

### Step 2: Regenerate Types

```bash
npx supabase gen types typescript --local > src/integrations/supabase/types.ts
```

### Step 3: Add Email Settings UI

Update `src/pages/Settings.tsx`:

```typescript
import { EmailNotificationSettings } from "@/components/EmailNotificationSettings";

export function Settings() {
  return (
    <div>
      {/* ... existing settings ... */}
      <EmailNotificationSettings />
    </div>
  );
}
```

This gives users toggles for each notification type.

### Step 4: Set Up Email Service

Choose one:

**Resend (recommended):**
1. Sign up at https://resend.com
2. Create API key
3. Add to Supabase Edge Function secrets

**SendGrid:**
1. Get API key from sendgrid.com
2. Add to Edge Function secrets

**AWS SES:**
1. Set up AWS credentials
2. Add to Edge Function secrets

### Step 5: Create Email Trigger

Add this to your database to trigger emails when notifications are created:

```sql
-- Function to queue email sending
CREATE OR REPLACE FUNCTION public.trigger_send_email_on_notification()
RETURNS TRIGGER AS $$
DECLARE
  has_http boolean;
BEGIN
  -- Check if http extension is enabled
  SELECT EXISTS(SELECT 1 FROM pg_extension WHERE extname = 'http')
  INTO has_http;
  
  IF has_http THEN
    -- Call Edge Function to send email
    PERFORM http_post(
      'https://{your-supabase-project}.supabase.co/functions/v1/send-notification-email',
      jsonb_build_object(
        'notification_id', NEW.id,
        'user_id', NEW.user_id,
        'notification_type', NEW.type,
        'title', NEW.title,
        'body', NEW.body,
        'sender_id', NEW.sender_id
      )::text,
      'application/json'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach to notifications table
DROP TRIGGER IF EXISTS on_notification_insert_send_email ON public.notifications;
CREATE TRIGGER on_notification_insert_send_email
AFTER INSERT ON public.notifications
FOR EACH ROW
EXECUTE FUNCTION public.trigger_send_email_on_notification();
```

**Note:** Enable the `http` extension in Supabase first:
```sql
CREATE EXTENSION IF NOT EXISTS http;
```

### Step 6: Deploy Edge Function

Update `supabase/functions/send-notification-email/index.ts` with your email service integration.

Deploy:
```bash
supabase functions deploy send-notification-email
```

Add secrets to Supabase:
```
RESEND_API_KEY=your_key_here
APP_URL=https://collar-connect.com
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_key
```

### Edge Function Logic

```typescript
export async function sendNotificationEmail(req: Request) {
  const { notification_id, user_id, notification_type, title, body, sender_id } = await req.json();
  
  // 1. Check email preferences
  const { data: prefs } = await supabase
    .from('email_preferences')
    .select(`email_on_${notification_type}`)
    .eq('user_id', user_id)
    .single();
  
  // 2. If disabled, skip (log and return)
  if (!prefs?.[`email_on_${notification_type}`]) {
    return new Response(JSON.stringify({ skipped: true }));
  }
  
  // 3. Get user email from auth.users
  const { data: { users } } = await supabase.auth.admin.listUsers();
  const user = users.find(u => u.id === user_id);
  
  if (!user?.email) {
    return new Response(JSON.stringify({ error: 'No email found' }), { status: 400 });
  }
  
  // 4. Send email via Resend
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'noreply@collar-connect.com',
      to: user.email,
      subject: title,
      html: generateEmailHTML(notification_type, title, body, sender_id),
    }),
  });
  
  const result = await response.json();
  
  // 5. Log in email_logs
  await supabase
    .from('email_logs')
    .insert({
      user_id,
      recipient_email: user.email,
      notification_type,
      notification_id,
      subject: title,
      status: response.ok ? 'sent' : 'failed',
      error_message: response.ok ? null : result.message,
      sent_at: response.ok ? new Date().toISOString() : null,
    });
  
  return new Response(JSON.stringify({ success: response.ok }));
}
```

## File Locations

**New Files Created:**
- `src/hooks/useEmailPreferences.ts` - Manage user preferences
- `src/components/EmailNotificationSettings.tsx` - Settings UI
- `src/lib/email-notifications.ts` - Helper utilities
- `supabase/migrations/20260224_add_email_notifications.sql` - Database table schema
- `supabase/functions/send-notification-email/index.ts` - Email sending function

**Files Modified:**
- `src/hooks/useMessaging.ts` - (no email calls - relies on triggers)
- `src/hooks/useConnections.ts` - (no email calls - relies on triggers)

## User Experience

1. User goes to Settings → Email Notifications
2. Sees toggles for:
   - Message notifications (default: ON)
   - Connection request notifications (default: ON)
   - Connection accepted notifications (default: ON)
   - Email digest option (daily/weekly summary)
3. Settings saved to `email_preferences` table
4. When actions happen, backend checks preferences before sending

## Monitoring

### View Sent Emails
```sql
SELECT * FROM email_logs 
WHERE status = 'sent' 
ORDER BY sent_at DESC
LIMIT 20;
```

### View Failed Emails
```sql
SELECT * FROM email_logs 
WHERE status = 'failed' 
ORDER BY created_at DESC;
```

### Check User Preferences
```sql
SELECT user_id, email_on_message, email_on_connection_request 
FROM email_preferences;
```

### Recent Notifications
```sql
SELECT n.*, u.full_name as sender_name
FROM notifications n
LEFT JOIN profiles u ON n.sender_id = u.id
WHERE n.created_at > now() - interval '1 hour'
ORDER BY n.created_at DESC;
```

## Troubleshooting

### Emails not sending?
1. Check if `http` extension is enabled: `SELECT * FROM pg_extension;`
2. Verify Edge Function is deployed: `supabase functions list`
3. Check Edge Function logs in Supabase dashboard
4. Verify API keys are set: `supabase secrets list`
5. Query `email_logs` table for errors

### Specific notification not emailing?
1. Check `email_preferences` for user - toggle might be OFF
2. Verify notification was created in `notifications` table
3. Check `email_logs` for that notification_id

### User not receiving?
1. Check spam/junk folder
2. Verify email in `auth.users` is correct
3. Query `email_logs` - might show 'failed' status
4. Check error_message field in `email_logs`

### Types not found after migration?
1. Make sure migration ran successfully in Supabase
2. Regenerate types: `npx supabase gen types typescript --local > src/integrations/supabase/types.ts`
3. Restart TypeScript server in VS Code

## Testing

1. Deploy migrations
2. Add a test user account
3. Send yourself a message in Dev Tools
4. Check:
   - Does notification appear in-app? (should be instant)
   - Does email appear in inbox? (check RESEND_API_KEY was set)
   - Is record in `email_logs`? (should show 'sent' status)
5. Toggle email preferences OFF
6. Send another message
7. Verify NO email sent (should show 'skipped' in logs)

## Performance Considerations

- Email sending is async, won't block message delivery
- Email failures won't break the app (logged separately)
- `email_logs` indexed by `user_id`, `status`, `created_at` for fast queries
- Preferences check is a single row lookup per email (very fast)

## Security Notes

- RLS enabled on `email_preferences` and `email_logs` - users can only view their own
- Service role key needed for Edge Function only (stored securely)
- Email addresses not exposed in notifications (only shown to recipient)
- Consider adding `unsubscribe` tokens for production compliance

