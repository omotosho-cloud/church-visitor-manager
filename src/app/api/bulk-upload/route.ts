import { NextRequest, NextResponse } from 'next/server';
import { createVisitor, getVisitors, getTemplates, createMessageLog, createQueuedMessage } from '@/lib/db';
import { sendSms } from '@/lib/sms';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const text = await file.text();
    const lines = text.split('\n').filter(line => line.trim());
    
    if (lines.length < 2) {
      return NextResponse.json({ error: 'CSV file is empty' }, { status: 400 });
    }

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const rows = lines.slice(1);

    const existingVisitors = await getVisitors();
    const existingPhones = new Set(existingVisitors.map(v => v.phone));

    let successCount = 0;
    let errorCount = 0;

    for (const row of rows) {
      try {
        const values = row.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
        const visitor: any = {};

        headers.forEach((header, index) => {
          if (header === 'name') visitor.name = values[index];
          else if (header === 'phone') visitor.phone = values[index];
          else if (header === 'gender') visitor.gender = values[index]?.toLowerCase();
          else if (header === 'service') visitor.service = values[index];
          else if (header === 'notes') visitor.notes = values[index];
        });

        if (!visitor.name || !visitor.phone || !visitor.gender) {
          errorCount++;
          continue;
        }

        if (existingPhones.has(visitor.phone)) {
          errorCount++;
          continue;
        }

        const visitorData = await createVisitor(visitor);
        existingPhones.add(visitor.phone);
        successCount++;

        // Send instant SMS
        try {
          const templates = await getTemplates();
          const instantTemplate = templates.find(t => t.trigger_type === 'instant');

          if (instantTemplate) {
            const churchName = "RCCG Victory Center";
            const message = instantTemplate.message
              .replace(/{{name}}/g, visitor.name)
              .replace(/{{church_name}}/g, churchName)
              .replace(/{{service_attended}}/g, visitor.service || 'our');

            const result = await sendSms(visitor.phone, message);

            await createMessageLog({
              visitor_id: visitorData.id,
              visitor_name: visitor.name,
              phone: visitor.phone,
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
              phone: visitor.phone,
              message: t.message,
              scheduled_for: scheduledFor.toISOString(),
              status: 'pending',
            });
          }
        } catch (smsError) {
          console.error('SMS automation error:', smsError);
        }
      } catch (error) {
        errorCount++;
      }
    }

    return NextResponse.json({ success: successCount, errors: errorCount });
  } catch (error) {
    console.error('Bulk upload error:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
