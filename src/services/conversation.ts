// Conversation storage service for CRUD operations
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function createConversation(userId: string, tags?: string[]) {
  // Create a conversation for the given userId
  return prisma.conversation.create({
    data: {
      userId,
      tags: tags ?? [],
    },
  });
}

export async function getConversationById(conversationId: string) {
  return prisma.conversation.findUnique({
    where: { id: conversationId },
  });
}

export async function getConversationsByUserId(userId: string) {
  return prisma.conversation.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getOrCreateConversationByUserId(userId: string, tags?: string[]) {
  let conversation = await prisma.conversation.findFirst({ where: { userId } });
  if (!conversation) {
    conversation = await createConversation(userId, tags);
  }
  return conversation;
} 