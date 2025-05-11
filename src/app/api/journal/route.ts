import { NextRequest, NextResponse } from 'next/server';
import { deleteJournalEntry } from '@/services/journal';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const conversationId = searchParams.get('conversationId');
    if (!conversationId) {
      return NextResponse.json({ error: 'Missing conversationId' }, { status: 400 });
    }
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);
    const [journalEntries, totalJournalEntries] = await Promise.all([
      prisma.journalEntry.findMany({
        where: { conversationId },
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
      }),
      prisma.journalEntry.count({ where: { conversationId } }),
    ]);
    return NextResponse.json({ journalEntries, totalJournalEntries });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message || 'Failed to fetch journal entries' }, { status: 500 });
  }
} 