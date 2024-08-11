// protected/memories/page.tsx
//New Memory 

'use client';
import { useRouter } from 'next/navigation';
import React, { useState, useRef } from 'react';
import { ChevronLeft, ImageIcon, Mic, X } from 'lucide-react';
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
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleRemoveImage = () => {
    setImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSaveMemory = async () => {
    if (!title.trim() || !content.trim()) {
      setError('Both title and content are required.');
      return;
    }

    try {
      const supabase = createClient();
      
      const { data: userData, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        console.error('Error fetching user:', userError);
        setError('Failed to fetch user information');
        return;
      }

      if (!userData?.user) {
        console.error('User is null or undefined:', userData?.user);
        setError('User not authenticated');
        return;
      }

      let imageUrl: string | undefined = undefined;;
      if (image) {
        const fileName = `${userData.user.id}/${Date.now()}_${image.name}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('memory_images')
          .upload(fileName, image);

        if (uploadError) {
          console.error('Error uploading image:', uploadError);
          setError('Failed to upload image');
          return;
        }

        const { data: urlData } = supabase.storage
          .from('memory_images')
          .getPublicUrl(fileName);

        imageUrl = urlData.publicUrl;
      }

      await createMemory(title, content, userData.user.id, imageUrl);
      setTitle('');
      setContent('');
      setImage(null);
      setImagePreview(null);
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

          {imagePreview && (
            <div className="relative">
              <img src={imagePreview} alt="Preview" className="max-w-full h-auto rounded-lg" />
              <Button
                onClick={handleRemoveImage}
                className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1"
              >
                <X size={20} />
              </Button>
            </div>
          )}

          {error && <p className="text-red-500">{error}</p>}

          <Button
            onClick={handleSaveMemory}
            className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 px-6 rounded-lg self-end"
          >
            Save Memory
          </Button>
        </CardContent>

        <CardFooter className="mt-8 pt-6 border-t border-gray-200 flex justify-center items-center gap-6">
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="hidden"
            ref={fileInputRef}
          />
          <Button
            onClick={() => fileInputRef.current?.click()}
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