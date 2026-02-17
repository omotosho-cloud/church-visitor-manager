import { NextResponse } from 'next/server';
import { getSettings } from '@/lib/db';

export async function GET() {
  try {
    const settings = await getSettings();
    return NextResponse.json({ 
      church_name: settings.church_name, 
      logo: settings.logo 
    });
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json({ church_name: 'Church', logo: null });
  }
}
