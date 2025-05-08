jest.mock('services/openai/generateResponse', () => ({
  generateResponse: jest.fn(),
}));

import { processTwilioWebhook, TwilioWebhookEnv, TwilioClient, ProcessTwilioWebhookArgs } from '../logic'
import { generateResponse } from 'services/openai/generateResponse';

const validSignature = 'valid-signature'
const validBody = 'Body=Hello+Dad&From=%2B1234567890'
const validUrl = 'http://localhost:3000/api/webhook/twilio'

/**
 * Creates a mock request object for processTwilioWebhook.
 */
function createMockRequest({ body, headers = {}, url = validUrl }: { body: string; headers?: Record<string, string>; url?: string }): Pick<ProcessTwilioWebhookArgs, 'text' | 'headers' | 'url'> {
  return {
    text: () => Promise.resolve(body),
    headers: {
      get: (key: string) => headers[key],
    },
    url: url || validUrl,
  }
}

describe('Twilio Webhook Logic', () => {
  const env: TwilioWebhookEnv = {
    TWILIO_AUTH_TOKEN: 'test_auth_token',
    TWILIO_PHONE_NUMBER: '+15555555555',
  }
  const twilioClient: TwilioClient = {
    messages: {
      create: jest.fn(() => Promise.resolve()),
    },
  }
  const validateRequest = jest.fn<ReturnType<ProcessTwilioWebhookArgs['validateRequest']>, Parameters<ProcessTwilioWebhookArgs['validateRequest']>>()

  beforeEach(() => {
    jest.resetAllMocks();
    (generateResponse as jest.Mock).mockResolvedValue('AI response');
  });

  afterAll(() => {
    jest.resetAllMocks();
  });

  it('should reject requests with missing Twilio signature', async () => {
    const req = createMockRequest({ body: validBody, headers: { 'Content-Type': 'application/x-www-form-urlencoded' } })
    const response = await processTwilioWebhook({
      ...req,
      env,
      twilioClient,
      validateRequest,
    })
    expect(response.status).toBe(403)
  })

  it('should reject requests with invalid Twilio signature', async () => {
    validateRequest.mockReturnValue(false)
    const req = createMockRequest({ body: validBody, headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'x-twilio-signature': 'invalid-signature' } })
    const response = await processTwilioWebhook({
      ...req,
      env,
      twilioClient,
      validateRequest,
    })
    expect(response.status).toBe(403)
  })

  it('should return 400 if required parameters are missing', async () => {
    validateRequest.mockReturnValue(true)
    const req = createMockRequest({ body: 'Body=', headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'x-twilio-signature': validSignature } })
    const response = await processTwilioWebhook({
      ...req,
      env,
      twilioClient,
      validateRequest,
    })
    expect(response.status).toBe(400)
  })

  it('should accept valid requests and return 200', async () => {
    validateRequest.mockReturnValue(true)
    const req = createMockRequest({ body: validBody, headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'x-twilio-signature': validSignature } })
    const response = await processTwilioWebhook({
      ...req,
      env,
      twilioClient,
      validateRequest,
    })
    expect(response.status).toBe(200)
    expect(twilioClient.messages.create).toHaveBeenCalledWith({
      body: 'AI response',
      to: '+1234567890',
      from: env.TWILIO_PHONE_NUMBER,
    })
  })

  it('should call the response generator (OpenAI stub)', async () => {
    validateRequest.mockReturnValue(true)
    const req = createMockRequest({ body: validBody, headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'x-twilio-signature': validSignature } })
    await processTwilioWebhook({
      ...req,
      env,
      twilioClient,
      validateRequest,
    })
    expect(generateResponse).toHaveBeenCalledWith('Hello Dad', expect.anything())
  })
}) 