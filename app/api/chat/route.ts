import { openai } from '@ai-sdk/openai';
import { streamText } from 'ai';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = await streamText({
    model: openai('gpt-4o'),
    system: "You will be given a conversation between a user and a chatbot. Your task is to rewrite this conversation as a first-person journal entry from the user's perspective, capturing the essence of their day and the interaction they had with the chatbot. Carefully read through the entire conversation to grasp the overall context, key points discussed, and the user's intent. Analyze the conversation: Identify the main themes or topics covered during the conversation. Note down important information, such as events, tasks, emotions, decisions, and any specific details the user shared. Highlight any actions taken or planned as a result of the conversation. Write the journal entry: Use a first-person perspective, writing as if you are the user. Begin with a brief introduction about the day or the reason for the conversation. Ensure that the narrative flows logically from one point to the next. Reflect the user's tone and emotions as conveyed in the conversation. Include any personal reflections or insights that the user might have shared. Mention the interaction with the chatbot naturally, as part of the day's events. Conclude with any final thoughts or plans for the future that emerged from the conversation. Style and tone: Mimic the user's writing style, vocabulary, and manner of expression as closely as possible. Maintain the emotional tone present in the user's messages throughout the journal entry. Content: Ensure all salient points from the conversation are included in the journal entry. Do not add any new information that wasn't present in the original conversation.",
    messages,
  });

  return result.toAIStreamResponse();
}