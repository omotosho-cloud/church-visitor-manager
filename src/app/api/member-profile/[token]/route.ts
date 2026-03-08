import { NextRequest, NextResponse } from 'next/server';
import { getMemberByToken, updateMemberByToken, getMembers } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const member = await getMemberByToken(token);
    return NextResponse.json(member);
  } catch (error) {
    return NextResponse.json({ error: 'Member not found' }, { status: 404 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const body = await request.json();
    
    // Check for duplicate phone number if phone is being updated
    if (body.phone) {
      const currentMember = await getMemberByToken(token);
      const allMembers = await getMembers();
      const duplicate = allMembers.find(
        (m) => m.phone === body.phone && m.id !== currentMember.id
      );
      
      if (duplicate) {
        return NextResponse.json(
          { error: 'Phone number already registered to another member' },
          { status: 400 }
        );
      }
    }
    
    const member = await updateMemberByToken(token, body);
    return NextResponse.json(member);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update member' }, { status: 500 });
  }
}
