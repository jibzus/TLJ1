// app/api/generate-summary/route.js 

import { generateAndSaveSummary } from '@/lib/generate-summary';

export async function POST(req) {
  const { conversationId } = await req.json();

  try {
    await generateAndSaveSummary(conversationId);
    return new Response(JSON.stringify({ message: 'Summary generated successfully' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error generating summary:', error);
    return new Response(JSON.stringify({ error: 'Failed to generate summary' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}