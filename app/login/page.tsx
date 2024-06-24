import Link from "next/link";
import Image from "next/image";
import { headers } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { SubmitButton } from "./submit-button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export default function Login({
  searchParams,
}: {
  searchParams: { message: string };
}) {
  const signIn = async (formData: FormData) => {
    "use server";
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      return redirect("/login?message=Could not authenticate user");
    }
    return redirect("/protected/");
  };

  const signUp = async (formData: FormData) => {
    "use server";
    const origin = headers().get("origin");
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${origin}/auth/callback`,
      },
    });
    if (error) {
      return redirect("/login?message=Could not authenticate user");
    }
    return redirect("/login?message=Check email to continue sign in process");
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <Link
        href="/"
        className="absolute left-8 top-8 py-2 px-4 rounded-md no-underline text-foreground bg-btn-background hover:bg-btn-background-hover flex items-center group text-sm"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1"
        >
          <polyline points="15 18 9 12 15 6" />
        </svg>{" "}
        Back
      </Link>

      <Card className="w-full max-w-md p-6 text-center">
        <CardHeader>
          <CardTitle className="text-4xl font-extrabold mb-4">MemoryBox</CardTitle>
        </CardHeader>
        <CardContent>
          <Image
            src="/memoryboxlogo.png"
            alt="MemoryBox Icon"
            width={100}
            height={100}
            className="mx-auto mb-6"
          />
          <form className="flex flex-col gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700" htmlFor="email">
                Email
              </label>
              <input
                className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-sm shadow-sm placeholder-gray-400
                          focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                name="email"
                placeholder="you@example.com"
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700" htmlFor="password">
                Password
              </label>
              <input
                className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-sm shadow-sm placeholder-gray-400
                          focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                type="password"
                name="password"
                placeholder="••••••••"
                required
              />
            </div>
            <SubmitButton
              formAction={signIn}
              className="bg-green-700 text-white rounded-md px-4 py-2 text-sm font-medium hover:bg-green-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              pendingText="Signing In..."
            >
              Sign In
            </SubmitButton>
            <SubmitButton
              formAction={signUp}
              className="bg-white text-gray-700 border border-gray-300 rounded-md px-4 py-2 text-sm font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              pendingText="Signing Up..."
            >
              Sign Up
            </SubmitButton>
          </form>
          {searchParams?.message && (
            <p className="mt-4 p-4 bg-foreground/10 text-foreground text-center text-sm">
              {searchParams.message}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}