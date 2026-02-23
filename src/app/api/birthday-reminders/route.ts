import { NextResponse } from 'next/server';
import { getMembers, createMessageLog, getTemplates } from '@/lib/db';
import { sendSms } from '@/lib/sms';

export async function POST() {
  try {
    const members = await getMembers();
    const templates = await getTemplates();
    const today = new Date();
    const currentMonth = today.getMonth() + 1;
    const currentDay = today.getDate();

    const birthdayMembers = members.filter(
      m => m.birth_month === currentMonth && m.birth_day === currentDay
    );

    if (birthdayMembers.length === 0) {
      return NextResponse.json({ message: 'No birthdays today', count: 0 });
    }

    const birthdayTemplate = templates.find(t => t.trigger_type === 'birthday');
    if (!birthdayTemplate) {
      return NextResponse.json({ error: 'No birthday template found. Create one in Templates page.' }, { status: 400 });
    }

    let successCount = 0;
    let failCount = 0;

    for (const member of birthdayMembers) {
      const message = birthdayTemplate.message.replace(/{{name}}/g, member.name);
      
      try {
        const result = await sendSms(member.phone, message);
        
        await createMessageLog({
          phone: member.phone,
          message,
          status: result.success ? 'sent' : 'failed',
          provider_response: 'results' in result ? result.results : undefined,
        });

        if (result.success) {
          successCount++;
        } else {
          failCount++;
        }
      } catch (error) {
        failCount++;
      }
    }

    return NextResponse.json({
      message: 'Birthday reminders processed',
      total: birthdayMembers.length,
      success: successCount,
      failed: failCount,
    });
  } catch (error) {
    console.error('Birthday reminder error:', error);
    return NextResponse.json(
      { error: 'Failed to send birthday reminders' },
      { status: 500 }
    );
  }
}
