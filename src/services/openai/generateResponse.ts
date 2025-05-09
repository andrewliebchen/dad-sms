import 'openai/shims/node';
import OpenAI from 'openai';
import { getSystemPrompt } from './dad';
import { getRecentMessages } from '../message';
import { getRecentJournalEntries } from '../journal';

export async function generateResponse(message: string, context?: { from?: string; conversationId?: string }): Promise<string> {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    dangerouslyAllowBrowser: process.env.NODE_ENV === 'test',
  });
  try {
    let messages: OpenAI.ChatCompletionMessageParam[] = [
      { role: 'system', content: getSystemPrompt() },
    ];
    if (context?.conversationId) {
      // Fetch last 10 messages (buffer)
      const recentMessages = await getRecentMessages(context.conversationId, 10);
      // Add to prompt in chronological order
      messages = messages.concat(
        recentMessages
          .reverse()
          .map((msg: any) => ({
            role: msg.direction === 'INCOMING' ? 'user' : 'assistant',
            content: msg.content,
          }) as OpenAI.ChatCompletionMessageParam)
      );
      // Fetch last 3 journal entries
      const journalEntries = await getRecentJournalEntries(context.conversationId, 3);
      if (journalEntries.length > 0) {
        messages.push({
          role: 'system',
          content: `Dad's Journal Entries:\n${journalEntries
            .reverse()
            .map((entry: any, i: number) => `Entry ${i + 1}: ${entry.content}`)
            .join('\n\n')}`,
        } as OpenAI.ChatCompletionMessageParam);
      }
    }
    messages.push({ role: 'user', content: message } as OpenAI.ChatCompletionMessageParam);
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages,
      max_tokens: 200,
      temperature: 0.8,
      user: context?.from,
    });
    return completion.choices[0]?.message?.content?.trim() || 'Sorry, I had trouble thinking of a response.';
  } catch (error) {
    console.error('OpenAI API error:', error);
    return 'Sorry, I had trouble thinking of a response.';
  }
} 