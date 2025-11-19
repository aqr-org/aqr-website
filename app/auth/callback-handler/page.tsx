"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function CallbackHandlerContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const handleCallback = async () => {
      const supabase = createClient();

      // Check for hash fragments (PKCE flow with access_token)
      // Supabase redirects with hash fragments like: #access_token=...&refresh_token=...&type=recovery
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = hashParams.get("access_token");
      const refreshToken = hashParams.get("refresh_token");
      const type = hashParams.get("type");

      // Check for query code parameter (alternative PKCE flow)
      const code = searchParams.get("code");

      if (accessToken && refreshToken) {
        // Set the session using the tokens from hash fragments
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

        if (!error) {
          // Successfully set session, redirect to update password page
          router.push("/auth/update-password");
        } else {
          router.push(`/auth/error?error=${encodeURIComponent(error.message)}`);
        }
      } else if (code) {
        // Exchange code for session (server-side PKCE flow)
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (!error) {
          router.push("/auth/update-password");
        } else {
          router.push(`/auth/error?error=${encodeURIComponent(error.message)}`);
        }
      } else {
        // Check if user already has a session (might have been set by middleware)
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          router.push("/auth/update-password");
        } else {
          router.push("/auth/error?error=No valid token found. Please request a new password reset link.");
        }
      }
    };

    handleCallback();
  }, [router, searchParams]);

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="text-center">
        <p className="text-muted-foreground">Processing password reset...</p>
      </div>
    </div>
  );
}

export default function CallbackHandler() {
  return (
    <Suspense fallback={
      <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
        <div className="text-center">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    }>
      <CallbackHandlerContent />
    </Suspense>
  );
}

