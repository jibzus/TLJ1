// app/page.tsx
//Splash Screen

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import AuthButton from "@/components/AuthButton";
import { createClient } from "@/utils/supabase/server";

export default async function HomePage() {
  const canInitSupabaseClient = () => {
    try {
      createClient();
      return true;
    } catch (e) {
      return false;
    }
  };

  const isSupabaseConnected = canInitSupabaseClient();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <nav className="w-full flex justify-center border-b border-b-foreground/10 h-16 bg-white">
        <div className="w-full max-w-4xl flex justify-between items-center p-3 text-sm">
          <Image
            src="/memoryboxlogo.png"
            alt="MemoryBox Logo"
            width={40}
            height={40}
          />
          {isSupabaseConnected && <AuthButton />}
        </div>
      </nav>

      <main className="flex-1 flex items-center justify-center w-full px-4">
        <Card className="p-6 text-center w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-4xl font-extrabold mb-4">MemoryBox</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <Image
              src="/memoryboxlogo.png"
              alt="MemoryBox Icon"
              width={150}
              height={150}
              className="mb-4"
            />
            <Button asChild className="mb-3">
              <Link href="/login">Get Started</Link>
            </Button>
          </CardContent>
        </Card>
      </main>

      <footer className="w-full border-t border-t-foreground/10 p-8 flex justify-center text-center text-xs">
        <p>
          © 2024 MemoryBox. All rights reserved.
        </p>
      </footer>
    </div>
  );
}