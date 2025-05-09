import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // 1. Create a user
  const phoneNumber = '+1234567890';
  const user = await prisma.user.upsert({
    where: { phoneNumber },
    update: {},
    create: { phoneNumber },
  });
  console.log('User:', user);

  // 2. Create a conversation
  const conversation = await prisma.conversation.create({
    data: {
      userId: user.id,
      tags: ['test'],
    },
  });
  console.log('Conversation:', conversation);

  // 3. Add a message
  const message = await prisma.message.create({
    data: {
      conversationId: conversation.id,
      content: 'Hello, world!',
      direction: 'INCOMING',
    },
  });
  console.log('Message:', message);

  // 4. Add a journal entry
  const journalEntry = await prisma.journalEntry.create({
    data: {
      conversationId: conversation.id,
      content: 'This is a test journal entry.',
    },
  });
  console.log('JournalEntry:', journalEntry);

  // 5. Fetch and print all data
  const conversations = await prisma.conversation.findMany({
    where: { userId: user.id },
    include: {
      messages: true,
      journalEntries: true,
    },
  });
  console.dir(conversations, { depth: null });
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 