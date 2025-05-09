import { NextRequest, NextResponse } from 'next/server';
import { deleteJournalEntry } from '@/services/journal';

export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json();
    if (!id || typeof id !== 'string') {
      return NextResponse.json({ error: 'Missing or invalid journal entry ID' }, { status: 400 });
    }
    await deleteJournalEntry(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message || 'Failed to delete journal entry' }, { status: 500 });
  }
} 