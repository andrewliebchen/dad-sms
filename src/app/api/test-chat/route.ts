import { NextRequest, NextResponse } from 'next/server';
import { generateResponse } from '../webhook/twilio/openai';

export async function POST(req: NextRequest) {
  try {
    const { message, from } = await req.json();
    if (!message) {
      return NextResponse.json({ error: 'Missing message' }, { status: 400 });
    }
    const aiResponse = await generateResponse(message, { from: from || 'web-client' });
    return NextResponse.json({ response: aiResponse });
  } catch (error) {
    console.error('Error in test-chat API:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 