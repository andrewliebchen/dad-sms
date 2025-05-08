import { generateResponse } from './openai'

export interface TwilioWebhookEnv {
  TWILIO_AUTH_TOKEN: string
  TWILIO_PHONE_NUMBER: string
}

export interface TwilioClient {
  messages: {
    create: (opts: { body: string; to: string; from: string }) => Promise<unknown>
  }
}

export interface ProcessTwilioWebhookArgs {
  text: () => Promise<string>
  headers: { get: (key: string) => string | undefined }
  url: string
  env: TwilioWebhookEnv
  twilioClient: TwilioClient
  validateRequest: (
    authToken: string,
    signature: string,
    url: string,
    params: Record<string, string>
  ) => boolean
}

export interface ProcessTwilioWebhookResult {
  status: number
  body: string
}

/**
 * Processes a Twilio webhook request and returns a status/body result.
 * All dependencies are injected for testability.
 */
export async function processTwilioWebhook({ text, headers, url, env, twilioClient, validateRequest }: ProcessTwilioWebhookArgs): Promise<ProcessTwilioWebhookResult> {
  try {
    const body = await text()
    const params: Record<string, string> = Object.fromEntries(new URLSearchParams(body))
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