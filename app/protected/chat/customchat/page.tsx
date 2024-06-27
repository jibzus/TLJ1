'use client'

import React, { useEffect, useState, useCallback } from 'react';
import { useAssistant } from 'ai/react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { createClient } from '@/utils/supabase/client'
import { v4 as uuidv4 } from 'uuid';
import { PlusCircle } from 'lucide-react';

const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes in milliseconds

interface Conversation {
  conversation_id: string;
  user_id: string;
  start_time: string;
  end_time?: string;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export default function AIChatUI() {
  const router = useRouter();
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [inactivityTimer, setInactivityTimer] = useState<NodeJS.Timeout | null>(null);
  const { status, messages, input, submitMessage, handleInputChange } = useAssistant({
    api: '/api/assistant',
    /*onResponse: (response) => {
      console.log('API Response:', response);
    }, */
    onFinish: async (message: Message) => {
      console.log('Finished message:', message);
      await saveMessage(message.content, 'assistant');
      resetInactivityTimer();
    },
  });

  const resetInactivityTimer = useCallback(() => {
    if (inactivityTimer) clearTimeout(inactivityTimer);
    const newTimer = setTimeout(endConversation, INACTIVITY_TIMEOUT);
    setInactivityTimer(newTimer);
  }, [inactivityTimer]);

  useEffect(() => {
    fetchConversations();
    return () => {
      if (inactivityTimer) clearTimeout(inactivityTimer);
    };
  }, []);

  const fetchConversations = async () => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setError('User not authenticated');
        return;
      }

      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .eq('user_id', user.id)
        .order('start_time', { ascending: false });

      if (error) throw error;
      setConversations(data || []);
    } catch (err) {
      console.error('Error fetching conversations:', err);
      setError('Failed to fetch conversations');
    }
  };

  const startNewConversation = async () => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setError('User not authenticated');
        return;
      }

      const newConversationId = uuidv4();
      const { data, error } = await supabase
        .from('conversations')
        .insert([
          {
            conversation_id: newConversationId,
            user_id: user.id,
            start_time: new Date().toISOString(),
          }
        ])
        .select();

      if (error) throw error;
      setConversationId(newConversationId);
      fetchConversations();
      resetInactivityTimer();
    } catch (err) {
      console.error('Error starting new conversation:', err);
      setError('Failed to start new conversation');
      return null;
    }
  };

  const saveMessage = async (content: string, sender: 'user' | 'assistant') => {
    try {
      let currentConversationId = conversationId;
      if (!currentConversationId) {
        currentConversationId = await startNewConversation();
        if (!currentConversationId) {
          throw new Error('Failed to start a new conversation');
        }
      }
  
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }
  
      const { error } = await supabase
        .from('messages')
        .insert([
          {
            message_id: uuidv4(),
            conversation_id: currentConversationId,
            user_id: user.id,
            sender: sender,
            message_text: content,
            timestamp: new Date().toISOString(),
          }
        ]);
  
      if (error) throw error;
    } catch (err) {
      console.error('Error saving message:', err);
      setError(`Failed to save message: ${err.message || 'Unknown error'}`);
      throw err;
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      await saveMessage(input, 'user');
      submitMessage(e);
      resetInactivityTimer();
    } catch (err) {
      console.error('Error submitting message:', err);
    }
  };

  const endConversation = async () => {
    if (conversationId) {
      try {
        const supabase = createClient();
        await supabase
          .from('conversations')
          .update({ end_time: new Date().toISOString() })
          .eq('conversation_id', conversationId);

        // Trigger summary generation
        await fetch('/api/generate-summary', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ conversationId }),
        });

        setConversationId(null);
        fetchConversations();
      } catch (err) {
        console.error('Error ending conversation:', err);
        setError('Failed to end conversation');
      }
    }
  };

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  return (
    <div className="flex h-screen bg-white dark:bg-zinc-800">
      <aside className="w-80 border-r dark:border-zinc-700">
        <div className="p-4 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold">Conversations</h2>
            <Button size="icon" variant="ghost" onClick={startNewConversation}>
              <PlusCircle className="w-6 h-6" />
            </Button>
          </div>
          <div className="space-y-2">
            {conversations.map((conversation) => (
              <Card key={conversation.conversation_id} className="p-2">
                <CardContent>
                  <h3 className="font-semibold">Chat {conversation.conversation_id.slice(0, 8)}</h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    {new Date(conversation.start_time).toLocaleString()}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </aside>
      <section className="flex flex-col w-full">
        <header className="border-b dark:border-zinc-700 p-4 flex justify-between items-center">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Avatar className="relative overflow-visible w-10 h-10">
              <span className="absolute right-0 top-0 flex h-3 w-3 rounded-full bg-green-600" />
              <AvatarImage src="/placeholder-ai.jpg" />
              <AvatarFallback>AI</AvatarFallback>
            </Avatar>
            <div>
              AI Assistant
              <span className="text-xs text-green-600 block">Online</span>
            </div>
          </h2>
          <Button onClick={endConversation} disabled={!conversationId}>End Chat</Button>
        </header>
        <main className="flex-1 overflow-auto p-4">
          <div className="space-y-4">
            {messages.map((m) => (
              <div key={m.id} className={`flex items-end gap-2 ${m.role === 'assistant' ? '' : 'justify-end'}`}>
                <div className={`rounded-lg p-2 ${m.role === 'assistant' ? 'bg-zinc-200 dark:bg-zinc-700' : 'bg-blue-500 text-white'}`}>
                  <p className="text-sm">{m.content}</p>
                </div>
              </div>
            ))}
            {status === 'in_progress' && (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              </div>
            )}
          </div>
        </main>
        <footer className="border-t dark:border-zinc-700 p-4">
          <form onSubmit={handleSubmit} className="flex items-center gap-2">
            <Input
              className="flex-1"
              placeholder="Type a message..."
              value={input}
              onChange={handleInputChange}
              disabled={status !== 'awaiting_message'}
            />
            <Button type="submit" disabled={status !== 'awaiting_message'}>Send</Button>
          </form>
        </footer>
      </section>
    </div>
  );
}