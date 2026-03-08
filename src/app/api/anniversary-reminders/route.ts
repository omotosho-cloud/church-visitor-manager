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

    const anniversaryMembers = members.filter(
      m => m.anniversary_month === currentMonth && m.anniversary_day === currentDay
    );

    if (anniversaryMembers.length === 0) {
      return NextResponse.json({ message: 'No anniversaries today', count: 0 });
    }

    const anniversaryTemplate = templates.find(t => t.trigger_type === 'anniversary');
    if (!anniversaryTemplate) {
      return NextResponse.json({ error: 'No anniversary template found. Create one in Templates page.' }, { status: 400 });
    }

    let successCount = 0;
    let failCount = 0;

    for (const member of anniversaryMembers) {
      const message = anniversaryTemplate.message.replace(/{{name}}/g, member.name);
      
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
      message: 'Anniversary reminders processed',
      total: anniversaryMembers.length,
      success: successCount,
      failed: failCount,
    });
  } catch (error) {
    console.error('Anniversary reminder error:', error);
    return NextResponse.json(
      { error: 'Failed to send anniversary reminders' },
      { status: 500 }
    );
  }
}
