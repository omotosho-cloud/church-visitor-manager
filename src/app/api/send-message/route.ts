import { NextRequest, NextResponse } from 'next/server';
import { sendSms } from '@/lib/sms';

export async function POST(request: NextRequest) {
  try {
    const { phone, message } = await request.json();

    if (!phone || !message) {
      return NextResponse.json(
        { success: false, message: 'Phone and message required' },
        { status: 400 }
      );
    }

    const result = await sendSms(phone, message);
    return NextResponse.json(result);
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error' },
      { status: 500 }
    );
  }
}
