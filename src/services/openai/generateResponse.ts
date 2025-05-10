import 'openai/shims/node';
import OpenAI from 'openai';
import { getSystemPrompt } from './dad';
import { getRecentMessages } from '../message';
import { getRecentJournalEntries, Message as JournalMessage } from '../journal';

// Local type for journal entries (no 'direction')
type JournalEntry = {
  id: string;
  conversationId: string;
  content: string;
  createdAt: Date;
};

export async function generateResponse(message: string, context?: { from?: string; conversationId?: string }): Promise<string> {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    dangerouslyAllowBrowser: process.env.NODE_ENV === 'test',
  });
  try {
    let messages: OpenAI.ChatCompletionMessageParam[] = [
      { role: 'system', content: getSystemPrompt(new Date()) },
    ];
    console.log('generateResponse: context', context);
    if (context?.conversationId) {
      console.log('generateResponse: using conversationId', context.conversationId);
      // Fetch last 10 journal entries
      const journalEntries = await getRecentJournalEntries(context.conversationId, 10);
      console.log('generateResponse: fetched journal entries', journalEntries);
      if (journalEntries.length > 0) {
        messages.push({
          role: 'system',
          content: `--- Dad's Journal Entries (Memory) ---\nThese are Dad's private reflections and memories about his relationship with his son. Use them to inform Dad's responses, personality, and emotional continuity.\n\n${(journalEntries as JournalEntry[])
            .reverse()
            .map((entry: JournalEntry, i: number) => `Entry ${i + 1}: ${entry.content}`)
            .join('\n\n')}`,
        } as OpenAI.ChatCompletionMessageParam);
      }
      // Fetch last 10 messages (chronological order)
      const recentMessages = await getRecentMessages(context.conversationId, 10);
      console.log('generateResponse: fetched recent messages', recentMessages);
      messages = messages.concat(
        (recentMessages as JournalMessage[])
          .reverse()
          .map((msg: JournalMessage) => ({
            role: msg.direction === 'INCOMING' ? 'user' : 'assistant',
            content: msg.content,
          }) as OpenAI.ChatCompletionMessageParam)
      );
    }
    messages.push({ role: 'user', content: message } as OpenAI.ChatCompletionMessageParam);
    console.log('OpenAI prompt messages:', JSON.stringify(messages, null, 2));
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-2024-08-06',
      messages,
      max_tokens: 200,
      temperature: 1.0,
      user: context?.from,
    });
    return completion.choices[0]?.message?.content?.trim() || 'Sorry, I had trouble thinking of a response.';
  } catch (error) {
    console.error('OpenAI API error:', error);
    return 'Sorry, I had trouble thinking of a response.';
  }
} 