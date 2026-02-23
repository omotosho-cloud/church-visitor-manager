import { NextRequest, NextResponse } from 'next/server';
import { createMember, getMembers } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const text = await file.text();
    const lines = text.split('\n').filter(line => line.trim());
    
    if (lines.length < 2) {
      return NextResponse.json({ error: 'CSV file is empty' }, { status: 400 });
    }

    const existingMembers = await getMembers();
    const existingPhones = new Set(existingMembers.map(m => m.phone));

    let successCount = 0;
    let errorCount = 0;

    for (let i = 1; i < lines.length; i++) {
      try {
        const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
        const [name, phone, email, gender, category, status, address, notes] = values;

        if (!name || !phone || !gender) {
          errorCount++;
          continue;
        }

        if (existingPhones.has(phone)) {
          errorCount++;
          continue;
        }

        await createMember({
          name,
          phone,
          email: email || undefined,
          gender: gender.toLowerCase(),
          category: (category?.toLowerCase() || 'adult') as 'adult' | 'youth' | 'children',
          membership_status: (status?.toLowerCase() || 'active') as 'active' | 'inactive' | 'transferred',
          address: address || undefined,
          notes: notes || undefined,
          join_date: new Date().toISOString().split('T')[0],
        });

        existingPhones.add(phone);
        successCount++;
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
