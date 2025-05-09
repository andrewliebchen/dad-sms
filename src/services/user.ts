import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function getOrCreateUserByPhoneNumber(phoneNumber: string) {
  let user = await prisma.user.findUnique({ where: { phoneNumber } });
  if (!user) {
    user = await prisma.user.create({ data: { phoneNumber } });
  }
  return user;
}

export async function getAllUsers() {
  return prisma.user.findMany({
    select: { id: true, phoneNumber: true },
    orderBy: { phoneNumber: 'asc' },
  });
} 