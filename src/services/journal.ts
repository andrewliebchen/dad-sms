import 'openai/shims/node';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
import OpenAI from 'openai';
import { getSystemPrompt } from './openai/dad';

// Types
export interface JournalEntry {
  id: string;
  conversationId: string;
  content: string;
  createdAt: Date;
}

export interface Message {
  id: string;
  direction: 'INCOMING' | 'OUTGOING';
  content: string;
  journaled?: boolean;
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
export async function getRecentJournalEntries(conversationId: string, limit: number = 3): Promise<JournalEntry[]> {
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
  let prompt = `You are Dad, keeping a private journal about your ongoing SMS relationship with your son. Reflect on the last 10 messages (5 from you, 5 from your son). Consider what he has told you, what it means for your relationship, and how you feel about it.\n\nWrite a single, concise paragraph (no more than 4 sentences) capturing your most important thoughts, observations, and plans about your relationship with your son. Do NOT include a date or greeting. Focus on what matters most to you as Dad in this moment. Try not to repeat things from other journal entries, unless you've learned somethign new.`;
  if (lastJournalEntry) {
    prompt += `\n\nYour previous journal entry was:\n\"\"\"${lastJournalEntry}\"\"\"\n\nBuild on your previous reflections if relevant.`;
  }
  prompt += '\n\nRecent messages:';
  messages.forEach((msg) => {
    prompt += `\n${msg.direction === 'INCOMING' ? 'Son' : 'Dad'}: ${msg.content}`;
  });
  prompt += '\n\nJournal Entry:';

  const completion = await openai.chat.completions.create({
    model: 'o4-mini-2025-04-16',
    messages: [
      { role: 'system', content: getSystemPrompt(new Date()) },
      { role: 'user', content: prompt },
    ],
  });
  return completion.choices[0]?.message?.content?.trim() || '';
}

// Buffer/trigger logic for journal entry creation
export async function handleMessageBufferAndJournal(conversationId: string): Promise<void> {
  // Buffer threshold: 6 messages (3 user, 3 dad)
  const { getRecentMessages } = await import('./message');
  const recentMessages: Message[] = await getRecentMessages(conversationId, 6, true); // Only unjournaled
  const userCount = recentMessages.filter((m: Message) => m.direction === 'INCOMING').length;
  const dadCount = recentMessages.filter((m: Message) => m.direction === 'OUTGOING').length;
  if (recentMessages.length === 6 && userCount >= 3 && dadCount >= 3) {
    const lastJournal = await getRecentJournalEntries(conversationId, 1);
    const lastJournalContent = lastJournal[0]?.content;
    const journalText = await generateJournalEntry([...recentMessages].reverse(), lastJournalContent);
    await createJournalEntry(conversationId, journalText);
    // Mark these messages as journaled
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();
    await prisma.message.updateMany({
      where: { id: { in: recentMessages.map((m: Message) => m.id) } },
      data: { journaled: true },
    });
  }
}

// Delete a journal entry by ID
export async function deleteJournalEntry(journalEntryId: string) {
  return prisma.journalEntry.delete({
    where: { id: journalEntryId },
  });
} 