import { NextResponse } from 'next/server';
import { getServices } from '@/lib/db';

export async function GET() {
  try {
    const services = await getServices();
    return NextResponse.json(services);
  } catch (error) {
    console.error('Error fetching services:', error);
    return NextResponse.json(['Sunday Morning', 'Sunday Evening', 'Wednesday Service']);
  }
}
