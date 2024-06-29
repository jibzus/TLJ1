// app/api/generate-summary/route.js

import { generateAndSaveSummary } from '@/lib/generate-summary';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { tempConversationId, userId } = await req.json();
    
    if (!tempConversationId || !userId) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    console.log(`Generating summary for conversation ${tempConversationId} and user ${userId}`);

    const result = await generateAndSaveSummary(tempConversationId, userId);
    
    if (!result) {
      console.error('Failed to generate or save summary');
      return NextResponse.json({ error: 'Failed to generate or save summary' }, { status: 500 });
    }

    console.log('Summary generated successfully:', result);

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error('Error in generate-summary route:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}