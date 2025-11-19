import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/auth/update-password";

  const supabase = await createClient();

  if (code) {
    // Exchange the code for a session (PKCE flow)
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error) {
      // Successfully exchanged code for session, redirect to update password page
      redirect(next);
    } else {
      redirect(`/auth/error?error=${encodeURIComponent(error.message)}`);
    }
  } else {
    // No code parameter - check if user already has a session
    // This handles cases where Supabase redirects after token verification
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session) {
      // User has a session, redirect to update password page
      redirect("/auth/update-password");
    } else {
      // No session found, redirect to error
      redirect("/auth/error?error=No session found. Please request a new password reset link.");
    }
  }
}

