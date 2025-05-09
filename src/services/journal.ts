import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
import OpenAI from 'openai';

// Types
export interface JournalEntry {
  id: string;
  conversationId: string;
  content: string;
  createdAt: Date;
}

// Create a journal entry in the database
export async function createJournalEntry(conversationId: string, content: string) {
  return prisma.journalEntry.create({
    data: {
      conversationId,
      content,
    },
  });
}

// Get recent journal entries for a conversation
export async function getRecentJournalEntries(conversationId: string, limit: number = 3) {
  return prisma.journalEntry.findMany({
    where: { conversationId },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
}

// Generate a journal entry using OpenAI
export async function generateJournalEntry(messages: { content: string; direction: string }[], lastJournalEntry?: string): Promise<string> {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    dangerouslyAllowBrowser: process.env.NODE_ENV === 'test',
  });
  let prompt = `You are Dad, keeping a private journal about your ongoing SMS relationship with your son. Reflect on the last 10 messages (5 from you, 5 from your son). Consider what he has told you, what it means for your relationship, and how you feel about it. Write a short, thoughtful journal entry in your own words.`;
  if (lastJournalEntry) {
    prompt += `\n\nYour previous journal entry was:\n\"\"\"${lastJournalEntry}\"\"\"\n\nBuild on your previous reflections if relevant.`;
  }
  prompt += '\n\nRecent messages:';
  messages.forEach((msg, i) => {
    prompt += `\n${msg.direction === 'INCOMING' ? 'Son' : 'Dad'}: ${msg.content}`;
  });
  prompt += '\n\nJournal Entry:';

  const completion = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [
      { role: 'system', content: 'You are Dad, writing a private journal about your relationship with your son.' },
      { role: 'user', content: prompt },
    ],
    max_tokens: 250,
    temperature: 0.7,
  });
  return completion.choices[0]?.message?.content?.trim() || '';
}

// Buffer/trigger logic for journal entry creation
export async function handleMessageBufferAndJournal(conversationId: string): Promise<void> {
  // Buffer threshold: 4 messages (2 user, 2 dad)
  const { getRecentMessages } = await import('./message');
  const recentMessages: any[] = await getRecentMessages(conversationId, 4);
  const userCount = recentMessages.filter((m: any) => m.direction === 'INCOMING').length;
  const dadCount = recentMessages.filter((m: any) => m.direction === 'OUTGOING').length;
  if (recentMessages.length === 4 && userCount >= 2 && dadCount >= 2) {
    const lastJournal = await getRecentJournalEntries(conversationId, 1);
    const lastJournalContent = lastJournal[0]?.content;
    const journalText = await generateJournalEntry(recentMessages.reverse(), lastJournalContent);
    await createJournalEntry(conversationId, journalText);
  }
} 