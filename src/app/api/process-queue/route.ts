import { NextRequest, NextResponse } from 'next/server';
import { getQueuedMessages, updateQueuedMessage, getVisitor, getTemplate, createMessageLog } from '@/lib/db';
import { sendSms } from '@/lib/sms';

// This endpoint should be called by a cron service (e.g., Vercel Crons, EasyCron)
export async function POST(request: NextRequest) {
  try {
    // Verify cron secret if provided
    const cronSecret = request.headers.get('authorization');
    if (process.env.CRON_SECRET && cronSecret !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const now = new Date();
    const items = await getQueuedMessages();
    let processed = 0;
    let succeeded = 0;
    let failed = 0;

    for (const item of items) {
      if (new Date(item.scheduled_for) <= now) {
        try {
          const visitor = await getVisitor(item.visitor_id);
          const template = await getTemplate(item.template_id);

          const churchName = 'RCCG Victory Centre';
          const message = template.message
            .replace(/{{name}}/g, visitor.name)
            .replace(/{{church_name}}/g, churchName)
            .replace(/{{service_attended}}/g, visitor.service || 'our');

          const result = await sendSms(visitor.phone, message);

          await updateQueuedMessage(item.id!, {
            status: result.success ? 'sent' : 'failed',
          });

          await createMessageLog({
            visitor_id: visitor.id,
            visitor_name: visitor.name,
            phone: visitor.phone,
            message,
            status: result.success ? 'sent' : 'failed',
            provider_response: JSON.stringify(result),
          });

          if (result.success) {
            succeeded++;
          } else {
            failed++;
          }
          processed++;
        } catch (error) {
          console.error('Failed to process queue item:', error);
          try {
            await updateQueuedMessage(item.id!, { status: 'failed' });
          } catch (e) {
            console.error('Failed to update queue item status:', e);
          }
          failed++;
          processed++;
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${processed} messages`,
      stats: { processed, succeeded, failed },
    });
  } catch (error) {
    console.error('Queue processor error:', error);
    return NextResponse.json(
      { success: false, message: 'Processor error' },
      { status: 500 }
    );
  }
}
