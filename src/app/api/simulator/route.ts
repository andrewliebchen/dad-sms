import { NextRequest, NextResponse } from 'next/server';
import { generateResponse } from '../../../services/openai/generateResponse';
import { getOrCreateConversationByUserId, getRecentJournalEntries } from '../../../services/conversation';
import { createMessage } from '../../../services/message';
import { getOrCreateUserByPhoneNumber } from '../../../services/user';
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
    const aiResponse = await generateResponse(message, { from: phoneNumber });
    // Store the AI response as a message
    await createMessage(conversation.id, aiResponse, 'OUTGOING');
    // Handle buffer/journal logic
    const { handleMessageBufferAndJournal } = await import('../../../services/conversation');
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
    const from = searchParams.get('from') || 'web-client';
    const user = await getOrCreateUserByPhoneNumber(from);
    const conversation = await getOrCreateConversationByUserId(user.id);
    const messages = await prisma.message.findMany({
      where: { conversationId: conversation.id },
      orderBy: { createdAt: 'asc' },
    });
    const journalEntries = await getRecentJournalEntries(conversation.id, 5);
    return NextResponse.json({ messages, journalEntries });
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 