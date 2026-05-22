import { NextRequest, NextResponse } from 'next/server';
import { getQueuedMessages, updateQueuedMessage, getVisitor, getTemplate, createMessageLog, getMembers, getTemplates } from '@/lib/db';
import { sendSms } from '@/lib/sms';

const CHURCH_NAME = 'RCCG Victory Centre';

async function processFollowUpQueue() {
  const now = new Date();
  const items = await getQueuedMessages();
  let processed = 0, succeeded = 0, failed = 0;

  for (const item of items) {
    if (new Date(item.scheduled_for) <= now) {
      try {
        const visitor = await getVisitor(item.visitor_id);
        const template = await getTemplate(item.template_id);

        const message = template.message
          .replace(/{{name}}/g, visitor.name)
          .replace(/{{church_name}}/g, CHURCH_NAME)
          .replace(/{{service_attended}}/g, visitor.service || 'our');

        const result = await sendSms(visitor.phone, message);

        await updateQueuedMessage(item.id!, { status: result.success ? 'sent' : 'failed' });
        await createMessageLog({
          visitor_id: visitor.id,
          visitor_name: visitor.name,
          phone: visitor.phone,
          message,
          status: result.success ? 'sent' : 'failed',
          provider_response: JSON.stringify(result),
        });

        if (result.success) succeeded++; else failed++;
        processed++;
      } catch (error) {
        console.error('Failed to process queue item:', error);
        try { await updateQueuedMessage(item.id!, { status: 'failed' }); } catch {}
        failed++;
        processed++;
      }
    }
  }

  return { processed, succeeded, failed };
}

async function processBirthdaysAndAnniversaries() {
  const members = await getMembers();
  const templates = await getTemplates();
  const today = new Date();
  const currentMonth = today.getMonth() + 1;
  const currentDay = today.getDate();

  const birthdayTemplate = templates.find(t => t.trigger_type === 'birthday');
  const anniversaryTemplate = templates.find(t => t.trigger_type === 'anniversary');

  let birthdaySent = 0, anniversarySent = 0;

  for (const member of members) {
    if (birthdayTemplate && member.birth_month === currentMonth && member.birth_day === currentDay) {
      try {
        const message = birthdayTemplate.message
          .replace(/{{name}}/g, member.name)
          .replace(/{{church_name}}/g, CHURCH_NAME);
        const result = await sendSms(member.phone, message);
        await createMessageLog({
          phone: member.phone,
          message,
          status: result.success ? 'sent' : 'failed',
          provider_response: JSON.stringify(result),
        });
        if (result.success) birthdaySent++;
      } catch (error) {
        console.error('Birthday SMS error:', error);
      }
    }

    if (anniversaryTemplate && member.anniversary_month === currentMonth && member.anniversary_day === currentDay) {
      try {
        const message = anniversaryTemplate.message
          .replace(/{{name}}/g, member.name)
          .replace(/{{church_name}}/g, CHURCH_NAME);
        const result = await sendSms(member.phone, message);
        await createMessageLog({
          phone: member.phone,
          message,
          status: result.success ? 'sent' : 'failed',
          provider_response: JSON.stringify(result),
        });
        if (result.success) anniversarySent++;
      } catch (error) {
        console.error('Anniversary SMS error:', error);
      }
    }
  }

  return { birthdaySent, anniversarySent };
}

async function runAutomation(request: NextRequest) {
  const cronSecret = request.headers.get('authorization');
  if (cronSecret && process.env.CRON_SECRET && cronSecret !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const [queueStats, reminderStats] = await Promise.all([
      processFollowUpQueue(),
      processBirthdaysAndAnniversaries(),
    ]);

    return NextResponse.json({ success: true, queue: queueStats, reminders: reminderStats });
  } catch (error) {
    console.error('Automation error:', error);
    return NextResponse.json({ success: false, message: 'Automation error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  return runAutomation(request);
}

export async function POST(request: NextRequest) {
  return runAutomation(request);
}
