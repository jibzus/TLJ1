// protected/page.tsx

"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter
} from '@/components/ui/card';
import '../globals.css';
import { getAllMemories, deleteMemory } from '@/lib/supabase-operations';
import { createClient } from '@/utils/supabase/client';

// Define the Memory type
type Memory = {
  id: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
};

const ViewMemories: React.FC = () => {
  const router = useRouter();
  const [memories, setMemories] = useState<Memory[]>([]);
  const [sortBy, setSortBy] = useState<'created_at' | 'updated_at'>('created_at');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMemories = async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          setError('User not authenticated');
          return;
        }

        const memories = await getAllMemories(user.id);
        setMemories(memories);
      } catch (err) {
        setError('Failed to fetch memories');
        console.error(err);
      }
    };

    fetchMemories();
  }, []);

  const handleAddMemory = () => {
    router.push('/protected/memories/');
  };

  const handleEditMemory = (id: string) => {
    router.push(`/protected/memories/${id}/edit`);
  };

  const handleDeleteMemory = async (id: string) => {
    try {
      await deleteMemory(id);
      setMemories(memories.filter((memory) => memory.id !== id));
    } catch (err) {
      setError('Failed to delete memory');
      console.error(err);
    }
  };

  const handleSortBy = (field: 'created_at' | 'updated_at') => {
    setSortBy(field);
    const sortedMemories = [...memories].sort((a, b) => {
      return new Date(b[field]).getTime() - new Date(a[field]).getTime();
    });
    setMemories(sortedMemories);
  };

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  return (
    <div className="p-4 flex flex-col items-center text-center">
      <h1 className="mb-4 text-4xl font-extrabold tracking-tight lg:text-5xl">
        View Memories
      </h1>

      <div className="flex mb-4">
        <Button onClick={() => handleSortBy('created_at')} className="mr-2">
          Sort by Date
        </Button>
        <Button onClick={() => handleSortBy('updated_at')}>
          Sort by Modified
        </Button>
      </div>

      {memories.length === 0 ? (
        <div className="text-gray-500 dark:text-gray-400">
          <p className="leading-7 mt-6">Empty Memory Box</p>
          <p className="leading-7 mt-6">
            Start building memories by clicking the + button
          </p>
        </div>
      ) : (
        <div className="grid gap-4 w-full">
          {memories.map((memory) => (
            <Card key={memory.id}>
              <CardHeader>
                <CardTitle>{memory.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="leading-7 mt-2">{memory.content}</p>
              </CardContent>
              <CardFooter>
                <p className="text-xs text-gray-500">
                  Created: {new Date(memory.created_at).toLocaleString()}
                </p>
                <p className="text-xs text-gray-500">
                  Modified: {new Date(memory.updated_at).toLocaleString()}
                </p>
                <Button onClick={() => handleEditMemory(memory.id)} size="sm" className="mr-2">
                  Edit
                </Button>
                <Button onClick={() => handleDeleteMemory(memory.id)} size="sm" variant="destructive">
                  Delete
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      <Button
        onClick={handleAddMemory}
        className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-full fixed bottom-4 right-4 sm:bottom-8 sm:right-8"
        aria-label="Add Memory"
      >
        +
      </Button>
    </div>
  );
};

export default ViewMemories;