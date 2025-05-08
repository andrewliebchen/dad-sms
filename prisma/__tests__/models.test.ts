/**
 * @jest-environment node
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('Prisma Models', () => {
  beforeAll(async () => {
    // Clean up before tests
    await prisma.message.deleteMany();
    await prisma.conversation.deleteMany();
    await prisma.user.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should create a User', async () => {
    const user = await prisma.user.create({
      data: {
        phoneNumber: '+1234567890',
      },
    });
    expect(user).toHaveProperty('id');
    expect(user.phoneNumber).toBe('+1234567890');
  });

  it('should create a Conversation linked to a User', async () => {
    const user = await prisma.user.findFirstOrThrow();
    const conversation = await prisma.conversation.create({
      data: {
        userId: user.id,
        tags: ['test'],
      },
    });
    expect(conversation.userId).toBe(user.id);
    expect(conversation.tags).toContain('test');
  });

  it('should create a Message linked to a Conversation', async () => {
    const conversation = await prisma.conversation.findFirstOrThrow();
    const message = await prisma.message.create({
      data: {
        conversationId: conversation.id,
        content: 'Hello!',
        direction: 'INCOMING',
      },
    });
    expect(message.conversationId).toBe(conversation.id);
    expect(message.content).toBe('Hello!');
    expect(message.direction).toBe('INCOMING');
  });

  it('should fetch related data', async () => {
    const user = await prisma.user.findFirstOrThrow({
      include: {
        conversations: {
          include: {
            messages: true,
          },
        },
      },
    });
    expect(user.conversations.length).toBeGreaterThan(0);
    const conv = user.conversations[0];
    expect(conv.messages.length).toBeGreaterThan(0);
  });
}); 