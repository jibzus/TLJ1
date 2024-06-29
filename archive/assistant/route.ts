import { AssistantResponse } from 'ai';
import OpenAI from 'openai';
import { createClient } from '@/utils/supabase/server';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  // Parse the request body
  const input: {
    threadId: string | null;
    message: string;
    conversationId: string;
    userId: string;
  } = await req.json();

  // Create a Supabase client
  const supabase = createClient();

  // Create a thread if needed
  const threadId = input.threadId ?? (await openai.beta.threads.create({})).id;

  // Add a message to the thread
  const createdMessage = await openai.beta.threads.messages.create(threadId, {
    role: 'user',
    content: input.message,
  });

  // Save the user message to Supabase
  await supabase.from('messages').insert([
    {
      message_id: createdMessage.id,
      conversation_id: input.conversationId,
      user_id: input.userId,
      sender: 'user',
      message_text: input.message,
      timestamp: new Date().toISOString(),
    }
  ]);

  return AssistantResponse(
    { threadId, messageId: createdMessage.id },
    async ({ forwardStream, sendDataMessage }) => {
      // Run the assistant on the thread
      const runStream = openai.beta.threads.runs.stream(threadId, {
        assistant_id:
          process.env.ASSISTANT_ID ??
          (() => {
            throw new Error('ASSISTANT_ID is not set');
          })(),
      });

      // Forward run status would stream message deltas
      let runResult = await forwardStream(runStream);

      // Status can be: queued, in_progress, requires_action, cancelling, cancelled, failed, completed, or expired
      while (
        runResult?.status === 'requires_action' &&
        runResult.required_action?.type === 'submit_tool_outputs'
      ) {
        const tool_outputs =
          runResult.required_action.submit_tool_outputs.tool_calls.map(
            (toolCall: any) => {
              const parameters = JSON.parse(toolCall.function.arguments);
              switch (toolCall.function.name) {
                // Configure your tool calls here
                default:
                  throw new Error(
                    `Unknown tool call function: ${toolCall.function.name}`,
                  );
              }
            },
          );
        runResult = await forwardStream(
          openai.beta.threads.runs.submitToolOutputsStream(
            threadId,
            runResult.id,
            { tool_outputs },
          ),
        );
      }

      // After the run is completed, save the assistant's response to Supabase
      if (runResult?.status === 'completed') {
        const messages = await openai.beta.threads.messages.list(threadId);
        const assistantMessage = messages.data.find(m => m.role === 'assistant');
        if (assistantMessage) {
          await supabase.from('messages').insert([
            {
              message_id: assistantMessage.id,
              conversation_id: input.conversationId,
              user_id: input.userId,
              sender: 'assistant',
              message_text: assistantMessage.content[0].text.value,
              timestamp: new Date().toISOString(),
            }
          ]);

          // Update the conversation's end_time
          await supabase
            .from('conversations')
            .update({ end_time: new Date().toISOString() })
            .eq('conversation_id', input.conversationId);
        }
      }
    },
  );
}