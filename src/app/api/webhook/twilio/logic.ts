import { generateResponse } from '@/services/openai/generateResponse'
import { getOrCreateUserByPhoneNumber } from '@/services/user'
import { getOrCreateConversationByUserId } from '@/services/conversation'
import { createMessage } from '@/services/message'

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
  headers: { get: (key: string) => string | null }
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

    // Find or create user
    const user = await getOrCreateUserByPhoneNumber(fromNumber)
    // Find or create conversation
    const conversation = await getOrCreateConversationByUserId(user.id)
    // Store incoming message
    await createMessage(conversation.id, messageBody, 'INCOMING')

    // Generate response with context
    const response = await generateResponse(messageBody, { from: fromNumber, conversationId: conversation.id })
    // Store outgoing message
    await createMessage(conversation.id, response, 'OUTGOING')

    // After storing outgoing message, handle buffer/journal logic
    const { handleMessageBufferAndJournal } = await import('@/services/conversation');
    await handleMessageBufferAndJournal(conversation.id);

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