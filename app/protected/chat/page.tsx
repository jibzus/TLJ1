// app/protected/chat/page.tsx

'use client';

import React, { useEffect, useState } from 'react';
import { useChat, Message } from 'ai/react';
import { v4 as uuidv4 } from 'uuid';
import { createClient } from '@/utils/supabase/client';
import { SupabaseClient } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { ChevronLeft} from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format, formatDistanceToNow } from 'date-fns';

type ChatRole = 'user' | 'assistant' | 'system' | 'function' | 'data' | 'tool';

type Conversation = {
  temp_conversation_id: string;
  last_message: string;
  timestamp: string;
};

type ConversationSummary = {
  conversation_id: string;
  start_time: string;
  end_time: string;
  summary: string | null | undefined;
};

export default function Chat() {
  const [supabase, setSupabase] = useState<SupabaseClient | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [tempConversationId, setTempConversationId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [summaries, setSummaries] = useState<ConversationSummary[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('chats');
  const router = useRouter();

  const {
    messages,
    input,
    handleInputChange,
    handleSubmit: originalHandleSubmit,
    setMessages,
  } = useChat({
    onFinish: (message: Message) => {
      saveMessage(message.role, message.content);
    },
  });

  useEffect(() => {
    const initSupabase = async () => {
      const supabaseInstance = createClient();
      setSupabase(supabaseInstance);

      const { data: { user }, error } = await supabaseInstance.auth.getUser();
      if (error) {
        setError('Failed to authenticate user');
        return;
      }

      if (user) {
        setUserId(user.id);
        await fetchConversations(supabaseInstance, user.id);
        await fetchSummaries(supabaseInstance, user.id);
      } else {
        setError('No authenticated user found');
      }
    };

    initSupabase();
  }, []);

  const fetchConversations = async (supabase: SupabaseClient, userId: string) => {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('user_id', userId)
      .order('timestamp', { ascending: false });

    if (error) {
      setError('Failed to fetch conversations');
      return;
    }

    const groupedConversations = data.reduce((acc, message) => {
      if (!acc[message.temp_conversation_id]) {
        acc[message.temp_conversation_id] = {
          temp_conversation_id: message.temp_conversation_id,
          last_message: message.message_text,
          timestamp: message.timestamp,
        };
      }
      return acc;
    }, {});

    setConversations(Object.values(groupedConversations));
  };

  const fetchSummaries = async (supabase: SupabaseClient, userId: string) => {
    try {
      const { data, error } = await supabase
        .from('conversation_summaries')
        .select('*')
        .eq('user_id', userId)
        .order('end_time', { ascending: false });
  
      if (error) throw error;
  
      setSummaries(data);
    } catch (error: any) {
      console.error('Error fetching summaries:', error);
      setError(`Failed to fetch summaries: ${error.message || 'Unknown error'}`);
    }
  };

  const saveMessage = async (role: ChatRole, content: string) => {
    if (!supabase || !userId || !tempConversationId) return;

    try {
      const { error } = await supabase.from('messages').insert({
        user_id: userId,
        sender: role,
        message_text: content,
        temp_conversation_id: tempConversationId,
        timestamp: new Date().toISOString(),
      });

      if (error) throw error;

      await fetchConversations(supabase, userId);
    } catch (error: any) {
      console.error('Error saving message:', error);
      setError(`Failed to save message: ${error.message || 'Unknown error'}`);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!tempConversationId) {
      setTempConversationId(uuidv4());
    }
    await saveMessage('user', input);
    originalHandleSubmit(e);
  };

  const selectConversation = async (tempConversationId: string) => {
    setSelectedConversation(tempConversationId);
    setTempConversationId(tempConversationId);

    if (supabase && userId) {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('user_id', userId)
        .eq('temp_conversation_id', tempConversationId)
        .order('timestamp', { ascending: true });

      if (error) {
        setError('Failed to fetch conversation messages');
        return;
      }

      setMessages(data.map((msg: { id: string; sender: ChatRole; message_text: string }) => ({
        id: msg.id,
        role: msg.sender as ChatRole,
        content: msg.message_text,
      })));
    }
  };

  const endAndJournalConvo = async () => {
    if (!supabase || !userId || !tempConversationId) {
      setError('Missing required data to end conversation');
      return;
    }
    try {
      const response = await fetch('/api/generate-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          tempConversationId: tempConversationId,
          userId: userId 
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate summary');
      }

      const { summary, conversation_id } = await response.json();

      // Save as a memory
      const { error: memoryError } = await supabase
        .from('memories')
        .insert({
          user_id: userId,
          conversation_id: conversation_id,
          title: `Journal Entry ${new Date().toLocaleDateString()}`,
          content: summary,
        });

      if (memoryError) throw memoryError;

      // Refresh summaries
      await fetchSummaries(supabase, userId);

      // Clear current conversation
      setTempConversationId(null);
      setMessages([]);
      setSelectedConversation(null);

    } catch (error: any) {
      console.error('Error ending conversation:', error);
      setError(`Failed to end conversation: ${error.message || 'Unknown error'}`);
    }
  };

  if (error) {
    return <div className="text-red-500 p-4">{error}</div>;
  }

  return (
    <div>
    <Button
          onClick={() => router.push('/protected')}
          className="rounded-full p-2 bg-white text-gray-600 hover:bg-gray-200"
        >
          <ChevronLeft size={24} />
        </Button>
    <div className="flex h-screen bg-white dark:bg-zinc-800">
      <aside className="w-80 border-r dark:border-zinc-700">
        <div className="p-4 space-y-4">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="chats">Chats</TabsTrigger>
              <TabsTrigger value="summaries">Summaries</TabsTrigger>
            </TabsList>
            <TabsContent value="chats">
              <div className="space-y-2">
                {conversations.map((conv: Conversation) => (
                  <Card key={conv.temp_conversation_id} className="p-2 cursor-pointer" onClick={() => selectConversation(conv.temp_conversation_id)}>
                    <CardContent>
                      <h3 className="font-semibold">{format(new Date(conv.timestamp), "do MMMM yyyy 'at' HH:mm")}</h3>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        {formatDistanceToNow(new Date(conv.timestamp), { addSuffix: true })}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
            <TabsContent value="summaries">
              <div className="space-y-2">
                {summaries.map((summary: ConversationSummary) => (
                  <Card key={summary.conversation_id} className="p-2">
                    <CardContent>
                      <h3 className="font-semibold">{format(new Date(summary.end_time), "do MMMM yyyy 'at' HH:mm")}</h3>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        {summary.summary 
                          ? `${summary.summary.substring(0, 100)}...`
                          : "No summary available"}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </aside>
      <section className="flex flex-col w-full">
        <header className="border-b dark:border-zinc-700 p-4 flex justify-between items-center">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Avatar className="relative overflow-visible w-10 h-10">
              <span className="absolute right-0 top-0 flex h-3 w-3 rounded-full bg-green-600" />
              <AvatarImage src="/placeholder-user.jpg" />
              <AvatarFallback>AI</AvatarFallback>
            </Avatar>
            <div>
              Lorna
              <span className="text-xs text-green-600 block">Online</span>
            </div>
          </h2>
          <Button onClick={endAndJournalConvo}>End and Journal Convo</Button>
        </header>
        <main className="flex-1 overflow-auto p-4">
          <div className="space-y-4">
            {messages.map((m, index) => (
              <div key={index} className={`flex items-end gap-2 ${m.role === 'user' ? 'justify-end' : ''}`}>
                <div className={`rounded-lg p-2 ${m.role === 'user' ? 'bg-blue-500 text-white' : 'bg-zinc-200 dark:bg-zinc-700'}`}>
                  <p className="text-sm">{m.content}</p>
                </div>
              </div>
            ))}
          </div>
        </main>
        <footer className="border-t dark:border-zinc-700 p-4">
          <form onSubmit={handleSubmit} className="flex items-center gap-2">
            <Button size="icon" variant="ghost">
              <SmileIcon className="w-6 h-6" />
            </Button>
            <Input
              className="flex-1"
              placeholder="Type a message..."
              value={input}
              onChange={handleInputChange}
            />
            <Button type="submit">Send</Button>
          </form>
        </footer>
      </section>
    </div>
    </div>
  );
}

function PencilIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
      <path d="m15 5 4 4" />
    </svg>
  )
}

function SearchIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  )
}

function SmileIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M8 14s1.5 2 4 2 4-2 4-2" />
      <line x1="9" x2="9.01" y1="9" y2="9" />
      <line x1="15" x2="15.01" y1="9" y2="9" />
    </svg>
  )
}
