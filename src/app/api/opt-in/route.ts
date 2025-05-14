import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import twilio from 'twilio';

const prisma = new PrismaClient();
const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

const OPT_IN_SMS =
  "You're signing up to receive SMS from Dad Bot. Msg freq: occasional. Msg&data rates may apply. Reply YES to confirm, STOP to opt out, HELP for help.";

export async function POST(req: NextRequest) {
  const { phone } = await req.json();
  if (!phone || typeof phone !== 'string' || !/^\+?[1-9]\d{1,14}$/.test(phone)) {
    return NextResponse.json({ error: 'Invalid phone number.' }, { status: 400 });
  }

  // Upsert user, set smsOptIn to false, clear opt-in/out times
  await prisma.user.upsert({
    where: { phoneNumber: phone },
    update: {
      smsOptIn: false,
      smsOptInAt: null,
      smsOptOutAt: null,
      smsOptInMethod: null,
    },
    create: {
      phoneNumber: phone,
      smsOptIn: false,
      smsOptInAt: null,
      smsOptOutAt: null,
      smsOptInMethod: null,
    },
  });

  // Fallback: If Twilio credentials are missing, skip sending SMS
  if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN || !process.env.TWILIO_PHONE_NUMBER) {
    console.warn('[Opt-In] Twilio credentials missing, skipping SMS send.');
    return NextResponse.json({ ok: true, warning: 'Twilio credentials missing, SMS not sent.' });
  }

  // Send opt-in SMS
  try {
    await twilioClient.messages.create({
      to: phone,
      from: process.env.TWILIO_PHONE_NUMBER!,
      body: OPT_IN_SMS,
    });
  } catch (e) {
    console.warn('[Opt-In] Twilio SMS send failed:', e);
    // For local/demo, return success even if Twilio fails
    return NextResponse.json({ ok: true, warning: 'Twilio SMS send failed, but continuing for demo.' });
  }

  return NextResponse.json({ ok: true });
} 