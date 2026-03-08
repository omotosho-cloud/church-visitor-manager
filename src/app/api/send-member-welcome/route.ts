import { NextRequest, NextResponse } from 'next/server';
import { getSettings, getTemplates } from '@/lib/db';
import { sendSms } from '@/lib/sms';

export async function POST(request: NextRequest) {
  try {
    const { memberId, memberName, phone, profileToken } = await request.json();
    
    const settings = await getSettings();
    
    if (!settings.automation_enabled || !settings.member_welcome_enabled) {
      return NextResponse.json({ success: false, message: 'Member welcome automation disabled' });
    }

    const templates = await getTemplates();
    const welcomeTemplate = templates.find(t => t.trigger_type === 'member_welcome');
    
    if (!welcomeTemplate) {
      return NextResponse.json({ success: false, message: 'No member welcome template found' });
    }

    const profileUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/member-profile/${profileToken}`;
    
    const message = welcomeTemplate.message
      .replace(/\{\{name\}\}/g, memberName)
      .replace(/\{\{church_name\}\}/g, settings.church_name)
      .replace(/\{\{profile_link\}\}/g, profileUrl);

    const result = await sendSms(phone, message);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Member welcome error:', error);
    return NextResponse.json({ success: false, message: 'Failed to send welcome message' }, { status: 500 });
  }
}
