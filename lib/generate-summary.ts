import { createClient } from '@/utils/supabase/server';
import { Anthropic } from '@anthropic-ai/sdk';
import { v4 as uuidv4 } from 'uuid';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

export async function generateAndSaveSummary(tempConversationId: string, userId: string) {
  const supabase = createClient();
  // Generate a new conversation_id
  const conversationId = uuidv4();

  try {
    // Fetch all messages for the conversation
    const { data: messages, error } = await supabase
      .from('messages')
      .select('message_text, sender, timestamp')
      .eq('temp_conversation_id', tempConversationId)
      .order('timestamp', { ascending: true });

    if (error) {
      throw new Error(`Error fetching messages: ${error.message}`);
    }

    if (!messages || messages.length === 0) {
      throw new Error('No messages found for the conversation');
    }

    // Generate a prompt for the AI to summarize the conversation
    const prompt = `You are a helpful journaling assistant named Lorna. You will be given a conversation between a user and a chatbot. Your task is to rewrite this conversation (not a summary) as a first-person journal entry (you don't need to start with \\\"Dear Journal\\\" and or say anything else to preface your rewrite) from the user's perspective, capturing the essence of their day and the interaction they had with the chatbot as if written by the user. Carefully read through the entire conversation to grasp the overall context, key points discussed, and the user's intent. Analyze the conversation: Identify the main themes or topics covered during the conversation. Note down important information, such as events, tasks, emotions, decisions, and any specific details the user shared. Highlight any actions taken or planned as a result of the conversation. Write the journal entry: Use a first-person perspective, writing as if you are the user. Begin with a brief introduction about the day or the reason for the conversation. Ensure that the narrative flows logically from one point to the next. Let the flow of the narrative be natural, not formal and reflect the user's style in the conversation. Reflect the user's tone and emotions as conveyed in the conversation. Include any personal reflections or insights that the user might have shared. Mention the interaction with the chatbot naturally, as part of the day's events. Conclude with any final thoughts or plans for the future that emerged from the conversation. include Style and tone: Mimic the user's writing style, vocabulary, and manner of expression as closely as possible. Maintain the emotional tone present in the user's messages throughout the journal entry. Content: Ensure all salient points from the conversation are included in the journal entry. Do not add any new information that wasn't present in the original conversation. Take the following conversation as input:\n\n${messages
      .map(m => `${m.sender}: ${m.message_text}`)
      .join('\n')}`;

    // Use Anthropic API to generate a summary
    const response = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20240620",
      messages: [
        { role: "user", content: prompt }
      ],
      max_tokens: 1500,
      temperature: 0.7,
    });

    if (!response.content || response.content.length === 0) {
      throw new Error('No content returned from Anthropic');
    }

              
    let summary = '';
    for (const content of response.content) {
      if (content.type === 'text') {
        summary += content.text;
      }
    }

    summary = summary.trim();

    if (!summary) {
      throw new Error('Summary generation failed');
    }

    // Start a transaction
    const { data, error: transactionError } = await supabase.rpc('end_conversation', {
      p_temp_conversation_id: tempConversationId,
      p_conversation_id: conversationId,
      p_user_id: userId,
      p_summary: summary,
      p_start_time: messages[0].timestamp,
      p_end_time: new Date().toISOString()
    });

    if (transactionError) {
      console.error('Error in transaction:', transactionError);
      throw new Error(`Error in transaction: ${transactionError.message}`);
    }

    return { summary, conversationId };
  } catch (error) {
    console.error('Error in generateAndSaveSummary:', error);
    throw error;
  }
}