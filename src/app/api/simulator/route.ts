import { NextRequest, NextResponse } from 'next/server';
import { generateResponse } from '@/services/openai/generateResponse';
import { getOrCreateConversationByUserId } from '@/services/conversation';
import { createMessage } from '@/services/message';
import { getOrCreateUserByPhoneNumber, getAllUsers } from '@/services/user';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const { message, from } = await req.json();
    if (!message) {
      return NextResponse.json({ error: 'Missing message' }, { status: 400 });
    }
    const phoneNumber = from || 'web-client';
    // Ensure user exists
    const user = await getOrCreateUserByPhoneNumber(phoneNumber);
    // Get or create a conversation for this user
    const conversation = await getOrCreateConversationByUserId(user.id);
    // Store the incoming message
    await createMessage(conversation.id, message, 'INCOMING');
    // Generate AI response
    const aiResponse = await generateResponse(message, { from: phoneNumber, conversationId: conversation.id });
    // Store the AI response as a message
    await createMessage(conversation.id, aiResponse, 'OUTGOING');
    // Handle buffer/journal logic
    const { handleMessageBufferAndJournal } = await import('@/services/journal');
    await handleMessageBufferAndJournal(conversation.id);
    return NextResponse.json({ response: aiResponse, conversationId: conversation.id });
  } catch (error) {
    console.error('Error in simulator API:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    if (searchParams.get('users')) {
      const users = await getAllUsers();
      return NextResponse.json({ users });
    }
    const from = searchParams.get('from') || 'web-client';
    const user = await getOrCreateUserByPhoneNumber(from);
    const conversation = await getOrCreateConversationByUserId(user.id);
    // Pagination params
    const msgLimit = parseInt(searchParams.get('msgLimit') || '20', 10);
    const msgOffset = parseInt(searchParams.get('msgOffset') || '0', 10);
    const journalLimit = parseInt(searchParams.get('journalLimit') || '10', 10);
    const journalOffset = parseInt(searchParams.get('journalOffset') || '0', 10);
    // Messages with pagination
    const [messages, totalMessages] = await Promise.all([
      prisma.message.findMany({
        where: { conversationId: conversation.id },
        orderBy: { createdAt: 'asc' },
        skip: msgOffset,
        take: msgLimit,
      }),
      prisma.message.count({ where: { conversationId: conversation.id } }),
    ]);
    // Journal entries with pagination
    const [journalEntries, totalJournalEntries] = await Promise.all([
      prisma.journalEntry.findMany({
        where: { conversationId: conversation.id },
        orderBy: { createdAt: 'desc' },
        skip: journalOffset,
        take: journalLimit,
      }),
      prisma.journalEntry.count({ where: { conversationId: conversation.id } }),
    ]);
    return NextResponse.json({
      messages,
      totalMessages,
      journalEntries,
      totalJournalEntries,
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 