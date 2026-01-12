import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import CallbackClient from "./callback-client";
import { Suspense } from "react";

export default async function CallbackPage({
  searchParams,
}: {
  searchParams: Promise<{ 
    code?: string; 
    next?: string; 
    error?: string; 
    error_description?: string;
    type?: string;
  }>;
}) {
  const resolvedParams = await searchParams;
  const { code, next, error, error_description, type } = resolvedParams;

  if (error) {
    return redirect(`/auth/error?error=${encodeURIComponent(error_description || error)}`);
  }

  if (code) {
    const supabase = await createClient();
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!exchangeError) {
      // After successful code exchange, determine redirect path
      if (type === "recovery" || next === "/auth/update-password") {
        return redirect("/auth/update-password");
      }
      return redirect(next || "/protected");
    } else {
      // If code exchange fails, redirect to error page with the message
      return redirect(`/auth/error?error=${encodeURIComponent(exchangeError.message)}`);
    }
  }

  // If no code, it might be an implicit flow with hash fragments.
  // We need a client component to read the hash.
  return (
    <Suspense fallback={
      <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
        <div className="text-center">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    }>
      <CallbackClient next={next} />
    </Suspense>
  );
}

