/**
 * @jest-environment node
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

jest.setTimeout(20000);

describe('Prisma Models', () => {
  beforeAll(async () => {
    // Clean up before tests
    await prisma.journalEntry.deleteMany();
    await prisma.message.deleteMany();
    await prisma.conversation.deleteMany();
    await prisma.user.deleteMany();
  });

  beforeEach(async () => {
    // Clean up all tables before each test for isolation
    await prisma.journalEntry.deleteMany();
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
    // Explicitly create a user for this test
    const user = await prisma.user.create({
      data: { phoneNumber: '+1234567891' },
    });
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
    // Explicitly create a user and conversation for this test
    const user = await prisma.user.create({
      data: { phoneNumber: '+1234567892' },
    });
    const conversation = await prisma.conversation.create({
      data: {
        userId: user.id,
        tags: ['test'],
      },
    });
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
    // Explicitly create user, conversation, and message for this test
    const user = await prisma.user.create({
      data: { phoneNumber: '+1234567893' },
      include: { conversations: true },
    });
    const conversation = await prisma.conversation.create({
      data: {
        userId: user.id,
        tags: ['test'],
      },
    });
    await prisma.message.create({
      data: {
        conversationId: conversation.id,
        content: 'Hello!',
        direction: 'INCOMING',
      },
    });
    const fetchedUser = await prisma.user.findFirstOrThrow({
      where: { id: user.id },
      include: {
        conversations: {
          include: {
            messages: true,
          },
        },
      },
    });
    expect(fetchedUser.conversations.length).toBeGreaterThan(0);
    const conv = fetchedUser.conversations[0];
    expect(conv.messages.length).toBeGreaterThan(0);
  });

  it('should create a JournalEntry linked to a Conversation', async () => {
    const user = await prisma.user.create({
      data: { phoneNumber: '+1234567894' },
    });
    const conversation = await prisma.conversation.create({
      data: {
        userId: user.id,
        tags: ['journal'],
      },
    });
    const journalEntry = await prisma.journalEntry.create({
      data: {
        conversationId: conversation.id,
        content: 'Dad reflects on the conversation.',
      },
    });
    expect(journalEntry.conversationId).toBe(conversation.id);
    expect(journalEntry.content).toContain('Dad reflects');
  });
}); 