import { NextRequest, NextResponse } from 'next/server';
import { createVisitor, getVisitors, getTemplates, createMessageLog, createQueuedMessage } from '@/lib/db';
import { sendSms } from '@/lib/sms';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, phone, gender, service, notes } = body;

    if (!name || !phone || !gender) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check for duplicate phone
    const allVisitors = await getVisitors();
    const duplicate = allVisitors.find(v => v.phone === phone);
    if (duplicate) {
      return NextResponse.json({ error: 'Phone number already registered' }, { status: 400 });
    }

    // Create visitor
    const visitorData = await createVisitor({ name, phone, gender, service, notes });

    // Send instant SMS if template exists
    try {
      const templates = await getTemplates();
      const instantTemplate = templates.find(t => t.trigger_type === 'instant');

      if (instantTemplate) {
        const churchName = "RCCG Victory Center";
        const message = instantTemplate.message
          .replace(/{{name}}/g, name)
          .replace(/{{church_name}}/g, churchName)
          .replace(/{{service_attended}}/g, service || 'our');

        const result = await sendSms(phone, message);

        await createMessageLog({
          visitor_id: visitorData.id,
          visitor_name: name,
          phone,
          message,
          status: result.success ? 'sent' : 'failed',
          provider_response: 'results' in result ? result.results : undefined,
        });
      }

      // Queue delayed follow-ups
      const delayTemplates = templates.filter(t => t.trigger_type === 'delay' && t.delay_days);
      for (const t of delayTemplates) {
        const scheduledFor = new Date();
        scheduledFor.setDate(scheduledFor.getDate() + (t.delay_days || 0));

        await createQueuedMessage({
          visitor_id: visitorData.id!,
          template_id: t.id!,
          phone,
          message: t.message,
          scheduled_for: scheduledFor.toISOString(),
          status: 'pending',
        });
      }
    } catch (smsError) {
      console.error('SMS automation error:', smsError);
    }

    return NextResponse.json({ success: true, visitor: visitorData });
  } catch (error) {
    console.error('Error submitting visitor:', error);
    return NextResponse.json({ error: 'Failed to submit' }, { status: 500 });
  }
}
