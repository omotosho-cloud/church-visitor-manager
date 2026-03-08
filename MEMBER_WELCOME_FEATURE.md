# Member Welcome Feature

## Overview
Automatically send congratulations messages to new members with a secure link to edit their profile without requiring login.

## Features
- ✅ Automatic welcome SMS when member is added or promoted
- ✅ Unique secure profile edit link for each member
- ✅ Public profile page (no login required)
- ✅ Members can edit: name, phone, email, address, birthday, anniversary, photos
- ✅ Respects automation_enabled setting
- ✅ Separate toggle for member welcome messages
- ✅ Uses template system with "member_welcome" trigger type

## Setup Instructions

### 1. Database Migration
Run the SQL migration to add required columns:

```sql
-- Add profile_token column to members table
ALTER TABLE members 
ADD COLUMN IF NOT EXISTS profile_token TEXT UNIQUE;

-- Create index for faster token lookups
CREATE INDEX IF NOT EXISTS idx_members_profile_token ON members(profile_token);

-- Add member_welcome_enabled to settings table
ALTER TABLE settings 
ADD COLUMN IF NOT EXISTS member_welcome_enabled BOOLEAN DEFAULT false;
```

### 2. Enable Member Welcome in Settings
1. Go to **Dashboard > Settings**
2. Scroll to **Messaging Configuration**
3. Enable **"Automation Enabled"** (master switch)
4. Enable **"Member Welcome Messages"**
5. Click **Save Changes**

### 3. Create Member Welcome Template
1. Go to **Dashboard > Templates**
2. Click **"Create Template"**
3. Fill in:
   - **Name**: "Member Welcome"
   - **Trigger Type**: "Member Welcome"
   - **Message**: 
   ```
   Congratulations {{name}}! Welcome to {{church_name}} family. 
   Edit your profile here: {{profile_link}}
   ```
4. Click **Create Template**

### 4. Set App URL (Production)
Add to your `.env.local` or environment variables:
```env
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

## How It Works

### When Member is Added
1. Admin adds new member via "Add Member" dialog OR member self-registers via public form
2. System generates unique `profile_token` for the member
3. If automation is enabled, system:
   - Finds "member_welcome" template
   - Replaces variables: `{{name}}`, `{{church_name}}`, `{{profile_link}}`
   - Sends SMS via configured provider
4. Member receives SMS with unique profile link

### When Visitor is Promoted
1. Admin promotes visitor to member
2. Same process as above

### Member Profile Edit
1. Member clicks link: `/member-profile/{unique-token}`
2. Public page loads with their current information
3. Member can update:
   - Name, phone, email, address
   - Birthday (month/day)
   - Anniversary (month/day) if married
   - Birthday photo
   - Anniversary photo
4. Changes saved directly to database
5. No login required - security via unique token

## Security
- Each member has a unique, unguessable token
- Token is generated using timestamp + random string
- No authentication required (token acts as credential)
- Token is only shared via SMS to member's phone

## Template Variables
Available in "member_welcome" templates:
- `{{name}}` - Member's full name
- `{{church_name}}` - Church name from settings
- `{{profile_link}}` - Unique profile edit URL

## API Endpoints

### POST /api/send-member-welcome
Sends welcome message to new member
```json
{
  "memberId": "uuid",
  "memberName": "John Doe",
  "phone": "+2348012345678",
  "profileToken": "unique-token"
}
```

### GET /api/member-profile/[token]
Retrieves member data by token

### PUT /api/member-profile/[token]
Updates member data by token

## Files Created/Modified

### New Files
- `src/app/member-profile/[token]/page.tsx` - Public profile edit page
- `src/app/api/member-profile/[token]/route.ts` - API for profile CRUD
- `src/app/api/send-member-welcome/route.ts` - Welcome message sender
- `database-migration-member-welcome.sql` - Database migration

### Modified Files
- `src/lib/types.ts` - Added `profile_token` to Member, `member_welcome_enabled` to Settings, `member_welcome` to TriggerType
- `src/lib/db.ts` - Added token generation, `getMemberByToken`, `updateMemberByToken`
- `src/components/add-member-dialog.tsx` - Sends welcome message after creation
- `src/components/promote-to-member-dialog.tsx` - Sends welcome message after promotion
- `src/components/add-template-dialog.tsx` - Added "Member Welcome" trigger type
- `src/app/dashboard/settings/page.tsx` - Added member welcome toggle
- `src/app/api/member-submit/route.ts` - Sends welcome message for self-registered members

## Testing

### Test Member Welcome Flow
1. Enable automation and member welcome in settings
2. Create member welcome template
3. Add a new member with your phone number
4. Check SMS for welcome message with link
5. Click link and verify profile page loads
6. Update some information and save
7. Verify changes in dashboard

### Test Visitor Promotion
1. Add a visitor
2. Promote visitor to member
3. Verify welcome SMS is sent
4. Test profile edit link

## Troubleshooting

### No SMS Received
- Check automation_enabled is true
- Check member_welcome_enabled is true
- Verify "member_welcome" template exists
- Check SMS provider credentials
- Check message logs in Dashboard > History

### Profile Link Not Working
- Verify NEXT_PUBLIC_APP_URL is set correctly
- Check member has profile_token in database
- Verify token in URL matches database

### Can't Update Profile
- Check Supabase storage is configured for photo uploads
- Verify API route is accessible
- Check browser console for errors

## Future Enhancements
- Token expiration (optional)
- Email notifications in addition to SMS
- Profile completion tracking
- Member photo upload from profile page
- Password protection option for profiles
