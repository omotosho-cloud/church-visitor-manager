import { NextRequest, NextResponse } from 'next/server';
import { sendSms } from '@/lib/sms';
import { createMessageLog } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { visitors, message } = await request.json();

    if (!visitors || !Array.isArray(visitors) || visitors.length === 0) {
      return NextResponse.json({ error: 'No visitors selected' }, { status: 400 });
    }

    if (!message || message.trim() === '') {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const results = [];
    let successCount = 0;
    let failCount = 0;

    for (const visitor of visitors) {
      try {
        const result = await sendSms(visitor.phone, message);
        
        await createMessageLog({
          visitor_id: visitor.id,
          visitor_name: visitor.name,
          phone: visitor.phone,
          message,
          status: result.success ? 'sent' : 'failed',
          provider_response: result,
        });

        if (result.success) {
          successCount++;
        } else {
          failCount++;
        }

        results.push({
          visitor: visitor.name,
          phone: visitor.phone,
          success: result.success,
        });
      } catch (error) {
        failCount++;
        results.push({
          visitor: visitor.name,
          phone: visitor.phone,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return NextResponse.json({
      success: true,
      total: visitors.length,
      successCount,
      failCount,
      results,
    });
  } catch (error) {
    console.error('Bulk SMS error:', error);
    return NextResponse.json(
      { error: 'Failed to send bulk SMS' },
      { status: 500 }
    );
  }
}
