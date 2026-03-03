import { NextRequest, NextResponse } from 'next/server';
import { createMember, getMembers } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      name,
      phone,
      gender,
      marital_status,
      anniversary_month,
      anniversary_day,
      birth_month,
      birth_day,
      address,
      notes,
      email,
      category,
      membership_status,
      join_date,
      photo,
      anniversary_photo,
    } = body;

    if (!name || !phone || !gender) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const allMembers = await getMembers();
    const duplicate = allMembers.find((member) => member.phone === phone);
    if (duplicate) {
      return NextResponse.json({ error: 'Phone number already registered' }, { status: 400 });
    }

    const memberData = await createMember({
      name,
      phone,
      email,
      gender,
      marital_status,
      anniversary_month,
      anniversary_day,
      anniversary_photo,
      birth_month,
      birth_day,
      address,
      photo,
      notes,
      membership_status: membership_status || 'active',
      category: category || 'adult',
      join_date: join_date || new Date().toISOString().split('T')[0],
    });

    return NextResponse.json({ success: true, member: memberData });
  } catch (error) {
    console.error('Error submitting member:', error);
    return NextResponse.json({ error: 'Failed to submit' }, { status: 500 });
  }
}
