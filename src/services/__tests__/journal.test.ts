/**
 * @jest-environment node
 */
jest.setTimeout(20000);

jest.mock('openai', () => {
  return jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: jest.fn().mockResolvedValue({
          choices: [{ message: { content: 'Mocked journal entry.' } }],
        }),
      },
    },
  }));
});

jest.mock('../openai/dad', () => ({
  getSystemPrompt: () => 'System prompt',
}));

import { PrismaClient } from '@prisma/client';
import * as journal from '../journal';
import * as messageService from '../message';
import { generateJournalEntry } from '../journal';

let prisma: PrismaClient;
let userId: string;
let conversationId: string;

beforeAll(() => {
  prisma = new PrismaClient();
});

beforeEach(async () => {
  await prisma.journalEntry.deleteMany();
  await prisma.message.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.user.deleteMany({ where: { phoneNumber: '+15555555555' } });
  const user = await prisma.user.create({ data: { phoneNumber: '+15555555555' } });
  userId = user.id;
  const conversation = await prisma.conversation.create({ data: { userId, tags: [] } });
  conversationId = conversation.id;
});

afterEach(async () => {
  await prisma.journalEntry.deleteMany();
  await prisma.message.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.user.deleteMany();
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe('Journal Service', () => {
  describe('createJournalEntry', () => {
    it('should create a journal entry for a conversation', async () => {
      const entry = await journal.createJournalEntry(conversationId, 'Test content');
      expect(entry).toHaveProperty('id');
      expect(entry.conversationId).toBe(conversationId);
      expect(entry.content).toBe('Test content');
      const found = await prisma.journalEntry.findUnique({ where: { id: entry.id } });
      expect(found).not.toBeNull();
    });
    it('should throw if conversationId is invalid', async () => {
      await expect(journal.createJournalEntry('bad-id', 'content')).rejects.toThrow();
    });
  });

  describe('getRecentJournalEntries', () => {
    it('should return recent journal entries in descending order', async () => {
      await journal.createJournalEntry(conversationId, 'Entry 1');
      await journal.createJournalEntry(conversationId, 'Entry 2');
      await journal.createJournalEntry(conversationId, 'Entry 3');
      const entries = await journal.getRecentJournalEntries(conversationId, 2);
      expect(entries.length).toBe(2);
      expect(entries[0].content).toBe('Entry 3');
      expect(entries[1].content).toBe('Entry 2');
    });
    it('should return empty array for non-existent conversation', async () => {
      const entries = await journal.getRecentJournalEntries('bad-id', 2);
      expect(entries).toEqual([]);
    });
  });

  describe('generateJournalEntry', () => {
    it('should generate a journal entry using OpenAI (mocked)', async () => {
      const messages = [
        { content: 'Hi Dad', direction: 'INCOMING' },
        { content: 'Hello son', direction: 'OUTGOING' },
      ];
      const result = await journal.generateJournalEntry(messages, 'Previous entry');
      expect(result).toBe('Mocked journal entry.');
    });
    it('should handle OpenAI API failure', async () => {
      jest.resetModules();
      jest.doMock('openai', () => {
        return jest.fn().mockImplementation(() => ({
          chat: {
            completions: {
              create: jest.fn().mockRejectedValue(new Error('OpenAI error')),
            },
          },
        }));
      });
      jest.doMock('../openai/dad', () => ({
        getSystemPrompt: () => 'System prompt',
      }));
      const messages = [
        { content: 'Hi Dad', direction: 'INCOMING' },
      ];
      await expect(generateJournalEntry(messages)).rejects.toThrow('OpenAI error');
    });
  });

  describe('handleMessageBufferAndJournal', () => {
    it('should create a journal entry and mark messages as journaled when buffer is met', async () => {
      for (let i = 0; i < 3; i++) {
        await messageService.createMessage(conversationId, `User message ${i + 1}`, 'INCOMING');
        await messageService.createMessage(conversationId, `Dad message ${i + 1}`, 'OUTGOING');
      }
      let msgs = await prisma.message.findMany({ where: { conversationId } });
      expect(msgs.every(m => m.journaled === false)).toBe(true);
      await journal.handleMessageBufferAndJournal(conversationId);
      const entries = await prisma.journalEntry.findMany({ where: { conversationId } });
      expect(entries.length).toBe(1);
      msgs = await prisma.message.findMany({ where: { conversationId } });
      expect(msgs.every(m => m.journaled === true)).toBe(true);
    });
    it('should not create a journal entry if buffer is not met', async () => {
      for (let i = 0; i < 2; i++) {
        await messageService.createMessage(conversationId, `User message ${i + 1}`, 'INCOMING');
        await messageService.createMessage(conversationId, `Dad message ${i + 1}`, 'OUTGOING');
      }
      await journal.handleMessageBufferAndJournal(conversationId);
      const entries = await prisma.journalEntry.findMany({ where: { conversationId } });
      expect(entries.length).toBe(0);
    });
    it('should not create a journal entry if not enough INCOMING', async () => {
      for (let i = 0; i < 5; i++) {
        await messageService.createMessage(conversationId, `Dad message ${i + 1}`, 'OUTGOING');
      }
      await messageService.createMessage(conversationId, 'User message', 'INCOMING');
      await journal.handleMessageBufferAndJournal(conversationId);
      const entries = await prisma.journalEntry.findMany({ where: { conversationId } });
      expect(entries.length).toBe(0);
    });
    it('should not create a journal entry if not enough OUTGOING', async () => {
      for (let i = 0; i < 5; i++) {
        await messageService.createMessage(conversationId, `User message ${i + 1}`, 'INCOMING');
      }
      await messageService.createMessage(conversationId, 'Dad message', 'OUTGOING');
      await journal.handleMessageBufferAndJournal(conversationId);
      const entries = await prisma.journalEntry.findMany({ where: { conversationId } });
      expect(entries.length).toBe(0);
    });
    it('should not create duplicate journal entries for already journaled messages', async () => {
      for (let i = 0; i < 3; i++) {
        await messageService.createMessage(conversationId, `User message ${i + 1}`, 'INCOMING');
        await messageService.createMessage(conversationId, `Dad message ${i + 1}`, 'OUTGOING');
      }
      await journal.handleMessageBufferAndJournal(conversationId);
      await journal.handleMessageBufferAndJournal(conversationId);
      const entries = await prisma.journalEntry.findMany({ where: { conversationId } });
      expect(entries.length).toBe(1);
      const msgs = await prisma.message.findMany({ where: { conversationId } });
      expect(msgs.every(m => m.journaled === true)).toBe(true);
    });
  });

  describe('deleteJournalEntry', () => {
    it('should delete a journal entry by ID', async () => {
      const entry = await journal.createJournalEntry(conversationId, 'To be deleted');
      await journal.deleteJournalEntry(entry.id);
      const found = await prisma.journalEntry.findUnique({ where: { id: entry.id } });
      expect(found).toBeNull();
    });
    it('should throw if journalEntryId is invalid', async () => {
      await expect(journal.deleteJournalEntry('bad-id')).rejects.toThrow();
    });
  });
}); 