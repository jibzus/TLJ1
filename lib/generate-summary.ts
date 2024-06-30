import { createClient } from '@/utils/supabase/server';
import OpenAI from 'openai';
import { v4 as uuidv4 } from 'uuid';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
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
    const prompt = `You will be given a conversation between a user and a chatbot. Your task is to rewrite this conversation as a first-person journal entry from the user's perspective, capturing the essence of their day and the interaction they had with the chatbot. Carefully read through the entire conversation to grasp the overall context, key points discussed, and the user's intent. Analyze the conversation: Identify the main themes or topics covered during the conversation. Note down important information, such as events, tasks, emotions, decisions, and any specific details the user shared. Highlight any actions taken or planned as a result of the conversation. Write the journal entry: Use a first-person perspective, writing as if you are the user. Begin with a brief introduction about the day or the reason for the conversation. Ensure that the narrative flows logically from one point to the next. Reflect the user's tone and emotions as conveyed in the conversation. Include any personal reflections or insights that the user might have shared. Mention the interaction with the chatbot naturally, as part of the day's events. Conclude with any final thoughts or plans for the future that emerged from the conversation. Style and tone: Mimic the user's writing style, vocabulary, and manner of expression as closely as possible. Maintain the emotional tone present in the user's messages throughout the journal entry. Content: Ensure all salient points from the conversation are included in the journal entry. Do not add any new information that wasn't present in the original conversation. Take the following conversation as input:\n\n${messages
      .map(m => `${m.sender}: ${m.message_text}`)
      .join('\n')}`;

    // Use OpenAI API to generate a summary
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "You are a helpful journaling assistant." },
        { role: "user", content: prompt }
      ],
      max_tokens: 1500,
      temperature: 0.7,
    });

    if (!response.choices || response.choices.length === 0) {
      throw new Error('No choices returned from OpenAI');
    }

    const summary = response.choices[0].message?.content?.trim();

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
