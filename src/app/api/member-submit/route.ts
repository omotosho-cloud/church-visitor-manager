import { NextRequest, NextResponse } from 'next/server';
import { createMember, getMembers, getSettings, getTemplates, createMessageLog } from '@/lib/db';
import { sendSms } from '@/lib/sms';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      name,
      phone,
      gender,
      marital_status,
      anniversary_month,
      anniversary_day,
      birth_month,
      birth_day,
      address,
      notes,
      email,
      category,
      membership_status,
      join_date,
      photo,
      anniversary_photo,
    } = body;

    if (!name || !phone || !gender) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const allMembers = await getMembers();
    const duplicate = allMembers.find((member) => member.phone === phone);
    if (duplicate) {
      return NextResponse.json({ error: 'Phone number already registered' }, { status: 400 });
    }

    const memberData = await createMember({
      name,
      phone,
      email,
      gender,
      marital_status,
      anniversary_month,
      anniversary_day,
      anniversary_photo,
      birth_month,
      birth_day,
      address,
      photo,
      notes,
      membership_status: membership_status || 'active',
      category: category || 'adult',
      join_date: join_date || new Date().toISOString().split('T')[0],
    });

    // Send welcome message if member has profile_token
    if (memberData.profile_token) {
      try {
        const settings = await getSettings();
        
        if (settings.automation_enabled !== false && settings.member_welcome_enabled !== false) {
          const templates = await getTemplates();
          const welcomeTemplate = templates.find(t => t.trigger_type === 'member_welcome');
          
          if (welcomeTemplate) {
            const profileUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/member-profile/${memberData.profile_token}`;
            
            const message = welcomeTemplate.message
              .replace(/\{\{name\}\}/g, memberData.name)
              .replace(/\{\{church_name\}\}/g, settings.church_name || 'Our Church')
              .replace(/\{\{profile_link\}\}/g, profileUrl);

            const result = await sendSms(memberData.phone, message);
            console.log('Member welcome SMS result:', result);
          }
        }
      } catch (error) {
        console.error('Failed to send welcome message:', error);
      }
    }

    return NextResponse.json({ success: true, member: memberData });
  } catch (error) {
    console.error('Error submitting member:', error);
    return NextResponse.json({ error: 'Failed to submit' }, { status: 500 });
  }
}
