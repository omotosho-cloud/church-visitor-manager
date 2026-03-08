# Automated Birthday & Anniversary Reminders

## Overview
Automatically send birthday and anniversary messages to members daily using Vercel Cron Jobs.

## Features
- ✅ Automated birthday messages sent daily
- ✅ Automated anniversary messages sent daily
- ✅ Runs at 8:00 AM UTC every day
- ✅ Uses template system with "birthday" and "anniversary" trigger types
- ✅ Logs all messages sent
- ✅ Respects SMS/WhatsApp channel settings

## Setup Instructions

### 1. Create Templates

#### Birthday Template
1. Go to **Dashboard > Templates**
2. Click **"Create Template"**
3. Fill in:
   - **Name**: "Birthday Wishes"
   - **Trigger Type**: "Birthday"
   - **Message**: 
   ```
   Happy Birthday {{name}}! 🎉
   May God bless you abundantly today and always!
   - {{church_name}}
   ```
4. Click **Create Template**

#### Anniversary Template
1. Go to **Dashboard > Templates**
2. Click **"Create Template"**
3. Fill in:
   - **Name**: "Anniversary Wishes"
   - **Trigger Type**: "Anniversary"
   - **Message**: 
   ```
   Happy Anniversary {{name}}! 💑
   Celebrating your love today. May God continue to bless your union!
   - {{church_name}}
   ```
4. Click **Create Template**

### 2. Deploy to Vercel

The `vercel.json` file is already configured with cron jobs:

```json
{
  "crons": [
    {
      "path": "/api/birthday-reminders",
      "schedule": "0 8 * * *"
    },
    {
      "path": "/api/anniversary-reminders",
      "schedule": "0 8 * * *"
    }
  ]
}
```

**Schedule Explanation:**
- `0 8 * * *` = Every day at 8:00 AM UTC
- Adjust time by changing the hour (0-23)
- Example: `0 10 * * *` = 10:00 AM UTC

### 3. Push to GitHub and Deploy

```bash
git add .
git commit -m "Add automated birthday and anniversary reminders"
git push
```

Vercel will automatically:
- Detect the cron configuration
- Set up daily triggers
- Run the jobs at scheduled times

### 4. Verify Setup

1. Go to Vercel Dashboard → Your Project
2. Click **Settings** → **Cron Jobs**
3. You should see:
   - `/api/birthday-reminders` - Daily at 8:00 AM UTC
   - `/api/anniversary-reminders` - Daily at 8:00 AM UTC

## How It Works

### Daily Automation Flow:

```
Every day at 8:00 AM UTC:

1. Birthday Cron Triggers
   ↓
2. Checks all members for birthdays today
   ↓
3. Finds "birthday" template
   ↓
4. Sends SMS to each birthday member
   ↓
5. Logs results

AND

1. Anniversary Cron Triggers
   ↓
2. Checks all members for anniversaries today
   ↓
3. Finds "anniversary" template
   ↓
4. Sends SMS to each anniversary member
   ↓
5. Logs results
```

## API Endpoints

### POST /api/birthday-reminders
Sends birthday messages to members with birthdays today

**Response:**
```json
{
  "message": "Birthday reminders processed",
  "total": 3,
  "success": 3,
  "failed": 0
}
```

### POST /api/anniversary-reminders
Sends anniversary messages to members with anniversaries today

**Response:**
```json
{
  "message": "Anniversary reminders processed",
  "total": 2,
  "success": 2,
  "failed": 0
}
```

## Manual Testing

You can manually trigger the endpoints to test:

### Using Browser/Postman:
```
POST https://church-visitor-manager.vercel.app/api/birthday-reminders
POST https://church-visitor-manager.vercel.app/api/anniversary-reminders
```

### Using cURL:
```bash
curl -X POST https://church-visitor-manager.vercel.app/api/birthday-reminders
curl -X POST https://church-visitor-manager.vercel.app/api/anniversary-reminders
```

## Template Variables

Available in birthday and anniversary templates:
- `{{name}}` - Member's full name
- `{{church_name}}` - Church name from settings

## Checking Message Logs

1. Go to **Dashboard > History**
2. View all sent birthday/anniversary messages
3. Check delivery status
4. See timestamps and recipients

## Troubleshooting

### No Messages Sent

**Check:**
1. ✅ Templates exist with correct trigger types ("birthday" and "anniversary")
2. ✅ Members have birth_month/birth_day or anniversary_month/anniversary_day set
3. ✅ SMS provider credentials are configured
4. ✅ Vercel cron jobs are active (check Vercel Dashboard)

### Wrong Time Zone

Vercel cron runs in UTC. To adjust:
- Current: `0 8 * * *` (8:00 AM UTC)
- For 10:00 AM UTC: `0 10 * * *`
- For 6:00 AM UTC: `0 6 * * *`

Convert your local time to UTC:
- Nigeria (WAT = UTC+1): 8:00 AM UTC = 9:00 AM WAT
- For 8:00 AM WAT, use: `0 7 * * *` (7:00 AM UTC)

### Messages Not Delivered

Check **Dashboard > History** for:
- Failed status
- Provider error messages
- Invalid phone numbers

## Cron Schedule Examples

```
0 8 * * *   - Every day at 8:00 AM UTC
0 9 * * *   - Every day at 9:00 AM UTC
0 7 * * *   - Every day at 7:00 AM UTC
30 8 * * *  - Every day at 8:30 AM UTC
0 8 * * 0   - Every Sunday at 8:00 AM UTC
0 8 1 * *   - First day of every month at 8:00 AM UTC
```

## Cost Considerations

**Vercel Cron Jobs:**
- Free on Hobby plan (limited)
- Unlimited on Pro plan ($20/month)

**SMS Costs:**
- Depends on your provider (Termii/Twilio)
- Charged per message sent
- Example: 10 birthdays/day × 30 days = 300 SMS/month

## Alternative: External Cron Services

If you prefer not to use Vercel cron:

1. **Cron-job.org** (Free)
   - Add URL: `https://church-visitor-manager.vercel.app/api/birthday-reminders`
   - Schedule: Daily at your preferred time
   - Repeat for anniversary endpoint

2. **EasyCron**
3. **UptimeRobot**

## Files Created

- `src/app/api/anniversary-reminders/route.ts` - Anniversary automation endpoint
- `vercel.json` - Cron job configuration
- `BIRTHDAY_ANNIVERSARY_AUTOMATION.md` - This documentation

## Files Modified

- `src/lib/types.ts` - Added "anniversary" trigger type
- `src/components/add-template-dialog.tsx` - Added anniversary option

## Next Steps

1. ✅ Create birthday template
2. ✅ Create anniversary template
3. ✅ Push to GitHub
4. ✅ Verify cron jobs in Vercel Dashboard
5. ✅ Wait for next day or manually test
6. ✅ Check message logs

---

**Automation is now live!** 🎉 Members will automatically receive birthday and anniversary messages every day at 8:00 AM UTC.
