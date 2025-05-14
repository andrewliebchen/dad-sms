-- AlterTable
ALTER TABLE "User" ADD COLUMN     "smsOptIn" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "smsOptInAt" TIMESTAMP(3),
ADD COLUMN     "smsOptInMethod" TEXT,
ADD COLUMN     "smsOptOutAt" TIMESTAMP(3);
