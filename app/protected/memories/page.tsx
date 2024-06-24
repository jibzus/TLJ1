// protected/memories/page.tsx
//New Memory 

'use client';

import { useRouter } from 'next/navigation';
import React, { useState } from 'react';
import { ChevronLeft, ImageIcon, Mic } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createMemory } from '@/lib/supabase-operations';
import { createClient } from '@/utils/supabase/client';

const NewMemory: React.FC = () => {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [error, setError] = useState('');

  const handleSaveMemory = async () => {
    if (!title.trim() || !content.trim()) {
      setError('Both title and content are required.');
      return;
    }

    try {
      const supabase = createClient();
      
      // Fetch user information and handle potential errors
      const { data: userData, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        console.error('Error fetching user:', userError);
        setError('Failed to fetch user information');
        return;
      }

      console.log('Fetched user data:', userData);

      if (!userData?.user) {
        console.error('User is null or undefined:', userData?.user);
        setError('User not authenticated');
        return;
      }

      await createMemory(title, content, userData.user.id);
      setTitle('');
      setContent('');
      setError('');
      router.push('/protected/');
    } catch (err) {
      console.error('Failed to create memory:', err);
      setError('Failed to create memory');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-100 px-4 py-6 sm:px-6 lg:px-8">
      <header className="flex items-center mb-8">
        <Button
          onClick={() => router.push('/protected')}
          className="rounded-full p-2 bg-white text-gray-600 hover:bg-gray-200"
        >
          <ChevronLeft size={24} />
        </Button>
      </header>

      <Card className="flex-grow flex flex-col bg-white rounded-lg shadow-lg p-6">
        <CardHeader>
          <CardTitle className="text-3xl font-bold">New Memory</CardTitle>
          <CardDescription>
            Fill out the details below to create a new memory.
          </CardDescription>
        </CardHeader>

        <CardContent className="flex flex-col space-y-6">
          <Input
            type="text"
            placeholder="Memory Title..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-lg border p-3 shadow-sm"
          />

          <Textarea
            placeholder="Start writing..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full h-64 rounded-lg border p-3 shadow-sm resize-none"
          />

          {error && <p className="text-red-500">{error}</p>}

          <Button
            onClick={handleSaveMemory}
            className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 px-6 rounded-lg self-end"
          >
            Save Memory
          </Button>
        </CardContent>

        <CardFooter className="mt-8 pt-6 border-t border-gray-200 flex justify-center items-center gap-6">
          <Button
            onClick={() => alert('Add image functionality to be implemented')}
            className="flex items-center rounded-full p-3 hover:bg-gray-100"
          >
            <ImageIcon size={24} />
            <span className="ml-2 text-sm">Add Image</span>
          </Button>
          <Button
            onClick={() => alert('Record audio functionality to be implemented')}
            className="flex items-center rounded-full p-3 hover:bg-gray-100"
          >
            <Mic size={24} />
            <span className="ml-2 text-sm">Record Audio</span>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default NewMemory;
