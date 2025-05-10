const mockUser = { id: 'user-1', phoneNumber: '+1234567890' }
const mockConversation = { id: 'conv-1', userId: 'user-1' }
const mockResponse = 'Hi, son!'

jest.mock('@/services/user', () => ({
  getOrCreateUserByPhoneNumber: jest.fn(() => Promise.resolve(mockUser)),
}))
jest.mock('@/services/message', () => ({
  createMessage: jest.fn(() => Promise.resolve()),
}))
jest.mock('@/services/openai/generateResponse', () => ({
  generateResponse: jest.fn(() => Promise.resolve(mockResponse)),
}))

const env = {
  TWILIO_AUTH_TOKEN: 'test-token',
  TWILIO_PHONE_NUMBER: '+1234567890',
}
const twilioClient = {
  messages: {
    create: jest.fn(() => Promise.resolve({ sid: 'msg-1' })),
  },
}
const validateRequest = jest.fn(() => true)

const baseArgs = {
  env,
  twilioClient,
  validateRequest,
  url: 'https://example.com/twilio',
  headers: { get: (key: string) => (key === 'x-twilio-signature' ? 'sig' : null) },
}

describe('processTwilioWebhook', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.doMock('@/services/conversation', () => ({
      getOrCreateConversationByUserId: jest.fn(() => Promise.resolve(mockConversation)),
      handleMessageBufferAndJournal: jest.fn(() => Promise.resolve()),
    }));
  });

  it('returns 403 if Twilio signature is missing', async () => {
    const { processTwilioWebhook } = await import('./logic');
    const result = await processTwilioWebhook({
      ...baseArgs,
      headers: { get: () => null },
      text: async () => 'Body=Hello+Dad%21&From=%2B1234567890',
    })
    expect(result.status).toBe(403)
    expect(result.body).toMatch(/Missing Twilio signature/)
  })

  it('returns 403 if Twilio signature is invalid', async () => {
    const { processTwilioWebhook } = await import('./logic');
    const invalidValidate = jest.fn(() => false)
    const result = await processTwilioWebhook({
      ...baseArgs,
      validateRequest: invalidValidate,
      text: async () => 'Body=Hello+Dad%21&From=%2B1234567890',
    })
    expect(result.status).toBe(403)
    expect(result.body).toMatch(/Invalid Twilio signature/)
  })

  it('returns 400 if required params are missing', async () => {
    const { processTwilioWebhook } = await import('./logic');
    const result = await processTwilioWebhook({
      ...baseArgs,
      text: async () => 'Body=Hello+Dad%21', // Missing From
    })
    expect(result.status).toBe(400)
    expect(result.body).toMatch(/Missing required parameters/)
  })

  it('processes a valid Twilio webhook and sends a message', async () => {
    const { processTwilioWebhook } = await import('./logic');
    const text = async () => 'Body=Hello+Dad%21&From=%2B1234567890'
    const result = await processTwilioWebhook({
      ...baseArgs,
      text,
    })
    expect(result.status).toBe(200)
    expect(result.body).toBe('OK')
    expect(twilioClient.messages.create).toHaveBeenCalledWith({
      body: mockResponse,
      to: '+1234567890',
      from: env.TWILIO_PHONE_NUMBER,
    })
  })

  it('returns 500 on unexpected error', async () => {
    const { processTwilioWebhook } = await import('./logic');
    const errorArgs: typeof baseArgs & { text: () => Promise<string> } = {
      ...baseArgs,
      text: () => { throw new Error('fail') },
    }
    const result = await processTwilioWebhook(errorArgs)
    expect(result.status).toBe(500)
    expect(result.body).toMatch(/Internal Server Error/)
  })
}) 