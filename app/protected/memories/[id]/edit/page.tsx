// protected/memories/[id]/edit.tsx

'use client';

import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { ChevronLeft } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getMemory, updateMemory } from '@/lib/supabase-operations';
import { createClient } from '@/utils/supabase/client';

const EditMemory: React.FC = () => {
  const router = useRouter();
  const params = useParams();
  const { id } = params;
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const loadMemory = async () => {
      if (!id) return;

      setIsLoading(true);
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          setError('User not authenticated');
          return;
        }

        const memory = await getMemory(id as string);
        if (memory.user_id !== user.id) {
          setError('You do not have permission to edit this memory');
          return;
        }

        setTitle(memory.title);
        setContent(memory.content);
      } catch (err) {
        console.error(err);
        setError('Failed to load memory');
      } finally {
        setIsLoading(false);
      }
    };

    loadMemory();
  }, [id]);

  const handleSaveMemory = async () => {
    if (!title.trim() || !content.trim()) {
      setError('Both title and content are required.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await updateMemory(id as string, title, content);
      router.push('/protected/');
    } catch (err) {
      console.error(err);
      setError('Failed to update memory');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-red-500">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{error}</p>
            <Button
              onClick={() => router.push('/protected/')}
              className="mt-4"
            >
              Back to Memories
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-100 px-4 py-6 sm:px-6 lg:px-8">
      <header className="flex items-center mb-8">
        <Button
          onClick={() => router.push('/protected/')}
          className="rounded-full p-2 bg-white text-gray-600 hover:bg-gray-200"
        >
          <ChevronLeft size={24} />
        </Button>
      </header>

      <Card className="flex-grow flex flex-col bg-white rounded-lg shadow-lg p-6">
        <CardHeader>
          <CardTitle className="text-3xl font-bold">Edit Memory</CardTitle>
          <CardDescription>
            Modify the details of your memory below.
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
            disabled={isLoading}
          >
            {isLoading ? 'Saving...' : 'Save Changes'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default EditMemory;