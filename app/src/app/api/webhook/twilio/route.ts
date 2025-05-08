import { NextRequest, NextResponse } from 'next/server'
import twilio from 'twilio'
import { processTwilioWebhook } from './logic'

export async function POST(request: NextRequest) {
  const result = await processTwilioWebhook({
    text: () => request.text(),
    headers: request.headers,
    url: request.url,
    env: {
      TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN!,
      TWILIO_PHONE_NUMBER: process.env.TWILIO_PHONE_NUMBER!,
    },
    twilioClient: twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    ),
    validateRequest: twilio.validateRequest,
  })
  return new NextResponse(result.body, { status: result.status })
} 