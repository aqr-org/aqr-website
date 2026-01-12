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
    const { error: exchangeError, data } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!exchangeError) {
      // Check if this is a signup confirmation
      // If type is "signup", or we can detect a newly confirmed email, show confirmation page
      if (type === "signup") {
        // This is a signup confirmation - redirect to success page
        return redirect("/auth/confirm-success");
      }
      
      // Check if user's email was just confirmed (within last 30 seconds)
      // This helps detect signup confirmations even if the type parameter isn't preserved
      if (data?.user?.email_confirmed_at) {
        const confirmedAt = new Date(data.user.email_confirmed_at).getTime();
        const now = Date.now();
        const timeSinceConfirmation = now - confirmedAt;
        
        // If email was confirmed within the last 30 seconds and it's not a recovery flow,
        // treat as signup confirmation
        if (timeSinceConfirmation < 30000 && !next && type !== "recovery" && type !== "magiclink") {
          return redirect("/auth/confirm-success");
        }
      }
      
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

