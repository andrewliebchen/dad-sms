import { generateResponse } from './openai'

export async function processTwilioWebhook({ text, headers, url, env, twilioClient, validateRequest }) {
  try {
    const body = await text()
    const params = Object.fromEntries(new URLSearchParams(body))
    const twilioSignature = headers.get('x-twilio-signature')

    if (!twilioSignature) {
      return { status: 403, body: 'Missing Twilio signature' }
    }

    const isValid = validateRequest(
      env.TWILIO_AUTH_TOKEN,
      twilioSignature,
      url,
      params
    )

    if (!isValid) {
      return { status: 403, body: 'Invalid Twilio signature' }
    }

    const messageBody = params['Body']
    const fromNumber = params['From']

    if (!messageBody || !fromNumber) {
      return { status: 400, body: 'Missing required parameters' }
    }

    const response = await generateResponse(messageBody, { from: fromNumber })

    await twilioClient.messages.create({
      body: response,
      to: fromNumber,
      from: env.TWILIO_PHONE_NUMBER,
    })

    return { status: 200, body: 'OK' }
  } catch (error) {
    console.error('Error processing webhook:', error)
    return { status: 500, body: 'Internal Server Error' }
  }
} 