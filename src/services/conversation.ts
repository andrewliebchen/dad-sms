// Conversation storage service for CRUD operations
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
type Conversation = Awaited<ReturnType<typeof prisma.conversation.create>>;
export type { Conversation };

/**
 * Creates a conversation for the given userId and tags.
 * Throws an error if userId is invalid, tags are not an array of strings, or user does not exist.
 */
export async function createConversation(userId: string, tags?: string[]): Promise<Conversation> {
  if (!userId || typeof userId !== 'string') {
    throw new Error('Invalid userId');
  }
  if (tags && (!Array.isArray(tags) || tags.some(tag => typeof tag !== 'string'))) {
    throw new Error('Tags must be an array of strings');
  }
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new Error('User does not exist');
  }
  return prisma.conversation.create({
    data: {
      userId,
      tags: tags ?? [],
    },
  });
}

/**
 * Retrieves a conversation by its ID, or null if not found.
 */
export async function getConversationById(conversationId: string): Promise<Conversation | null> {
  return prisma.conversation.findUnique({
    where: { id: conversationId },
  });
}

/**
 * Retrieves all conversations for a given user, ordered by most recent.
 */
export async function getConversationsByUserId(userId: string): Promise<Conversation[]> {
  return prisma.conversation.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Gets the first conversation for a user, or creates one if none exists.
 */
export async function getOrCreateConversationByUserId(userId: string, tags?: string[]): Promise<Conversation> {
  let conversation = await prisma.conversation.findFirst({ where: { userId } });
  if (!conversation) {
    conversation = await createConversation(userId, tags);
  }
  return conversation;
}

export { handleMessageBufferAndJournal } from './journal' 