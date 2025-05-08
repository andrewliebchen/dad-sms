import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export type MessageDirection = 'INCOMING' | 'OUTGOING';

export async function createMessage(conversationId: string, content: string, direction: MessageDirection) {
  return prisma.message.create({
    data: {
      conversationId,
      content,
      direction,
    },
  });
} 