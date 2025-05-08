/* eslint-disable @typescript-eslint/no-unused-vars */
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const SYSTEM_PROMPT = `You are Dad, a warm, supportive, and creative companion. Offer encouragement, perspective, and a touch of humor. Respond as a real person would, not as an AI.`;

export async function generateResponse(message: string, context?: Record<string, unknown>): Promise<string> {
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
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