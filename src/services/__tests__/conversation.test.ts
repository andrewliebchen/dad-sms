/**
 * @jest-environment node
 */
import { PrismaClient } from '@prisma/client';
import { createConversation, getConversationById, getConversationsByUserId } from '../conversation';
import type { Conversation } from '../conversation';

describe('Conversation Storage Service', () => {
  const prisma = new PrismaClient();
  let userId: string;

  beforeEach(async () => {
    // Clean up test users before each test to avoid unique constraint errors
    await prisma.journalEntry.deleteMany();
    await prisma.message.deleteMany();
    await prisma.conversation.deleteMany();
    await prisma.user.deleteMany({ where: { phoneNumber: { in: ['+15555555555', '+16666666666'] } } });

    // Create test user for each test
    const user = await prisma.user.create({ data: { phoneNumber: '+15555555555' } });
    userId = user.id;
  });

  afterAll(async () => {
    // Clean up
    await prisma.journalEntry.deleteMany();
    await prisma.message.deleteMany();
    await prisma.conversation.deleteMany();
    await prisma.user.deleteMany();
    await prisma.$disconnect();
  });

  describe('createConversation', () => {
    it('should create a conversation for a user', async () => {
      const tags = ['test', 'important'];
      const conversation = await createConversation(userId, tags);
      expect(conversation).toHaveProperty('id');
      expect(conversation.userId).toBe(userId);
      expect(conversation.tags).toEqual(tags);
      // Check it exists in the DB
      const found = await prisma.conversation.findUnique({ where: { id: conversation.id } });
      expect(found).not.toBeNull();
      expect(found?.userId).toBe(userId);
      expect(found?.tags).toEqual(tags);
    });
    it('should throw if user does not exist', async () => {
      // TODO: Implement test
    });
  });

  describe('getConversationById', () => {
    it('should retrieve a conversation by ID', async () => {
      const tags = ['byid'];
      const conversation = await createConversation(userId, tags);
      const found = await getConversationById(conversation.id);
      expect(found).not.toBeNull();
      expect(found?.id).toBe(conversation.id);
      expect(found?.userId).toBe(userId);
      expect(found?.tags).toEqual(tags);
    });
    it('should return null if conversation does not exist', async () => {
      const found = await getConversationById('nonexistent-id');
      expect(found).toBeNull();
    });
  });

  describe('getConversationsByUserId', () => {
    it('should retrieve all conversations for a user', async () => {
      // Create two conversations for the user
      const tags1 = ['multi1'];
      const tags2 = ['multi2'];
      const conv1 = await createConversation(userId, tags1);
      const conv2 = await createConversation(userId, tags2);
      const conversations = await getConversationsByUserId(userId);
      const ids = conversations.map((c: Conversation) => c.id);
      expect(ids).toContain(conv1.id);
      expect(ids).toContain(conv2.id);
    });
    it('should return an empty array if user has no conversations', async () => {
      // Create a new user
      const user = await prisma.user.create({ data: { phoneNumber: '+16666666666' } });
      const conversations = await getConversationsByUserId(user.id);
      expect(conversations).toEqual([]);
    });
  });

  describe('Error handling', () => {
    it('should handle database errors gracefully', async () => {
      // TODO: Implement test
    });
  });
}); 