import 'openai/shims/node';
import OpenAI from 'openai';
import { getSystemPrompt } from './dad';

export async function generateResponse(message: string, context?: Record<string, unknown>): Promise<string> {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    dangerouslyAllowBrowser: process.env.NODE_ENV === 'test',
  });
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: getSystemPrompt() },
        { role: 'user', content: message },
      ],
      max_tokens: 200,
      temperature: 0.8,
      user: context?.from as string | undefined,
    });
    return completion.choices[0]?.message?.content?.trim() || 'Sorry, I had trouble thinking of a response.';
  } catch (error) {
    console.error('OpenAI API error:', error);
    return 'Sorry, I had trouble thinking of a response.';
  }
} 