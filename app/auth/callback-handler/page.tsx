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

      // Check for hash fragments FIRST (PKCE flow with access_token)
      // Supabase redirects with hash fragments like: #access_token=...&refresh_token=...&type=recovery
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = hashParams.get("access_token");
      const refreshToken = hashParams.get("refresh_token");
      const type = hashParams.get("type");
      const errorParam = hashParams.get("error");
      const errorDescription = hashParams.get("error_description");

      // Get the next parameter from query string (where to redirect after successful auth)
      const next = searchParams.get("next") || "/protected";

      // If there's an error in the hash, handle it
      if (errorParam) {
        router.push(`/auth/error?error=${encodeURIComponent(errorDescription || errorParam)}`);
        return;
      }

      // Priority 1: Hash fragments with tokens (most common for PKCE recovery)
      if (accessToken && refreshToken) {
        try {
          // Set the session using the tokens from hash fragments
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (!error) {
            // Only redirect to password reset if this is a recovery flow
            if (type === "recovery") {
              router.push("/auth/update-password");
            } else {
              // For signup or other flows, redirect to the next parameter or protected page
              router.push(next);
            }
            return;
          } else {
            router.push(`/auth/error?error=${encodeURIComponent(error.message)}`);
            return;
          }
        } catch (err) {
          router.push(`/auth/error?error=${encodeURIComponent(err instanceof Error ? err.message : "Failed to set session")}`);
          return;
        }
      }

      // Priority 2: Check for query code parameter
      // Note: For PKCE recovery flow, Supabase redirects with hash fragments, not query code
      // If we have a code but no hash fragments, it might be from a different flow
      // However, code exchange requires code verifier which isn't available in redirect context
      // So we skip code exchange and check for session instead
      const code = searchParams.get("code");
      if (code && !accessToken) {
        // Code present but no hash fragments - this shouldn't happen for PKCE recovery
        // Check if session was already set by middleware or Supabase
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          // Only redirect to password reset if next parameter explicitly says so
          if (next === "/auth/update-password") {
            router.push("/auth/update-password");
          } else {
            router.push(next);
          }
          return;
        }
        // If no session and we have a code but can't exchange it, it's an error
        if (next === "/auth/update-password") {
          router.push("/auth/error?error=Invalid recovery link. Please request a new password reset email.");
        } else {
          router.push("/auth/error?error=Invalid confirmation link. Please try again.");
        }
        return;
      }

      // Priority 3: Check if user already has a session (might have been set by middleware or previous step)
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        // Only redirect to password reset if next parameter explicitly says so
        if (next === "/auth/update-password") {
          router.push("/auth/update-password");
        } else {
          router.push(next);
        }
        return;
      }

      // No valid token or session found
      // Only show password reset error if this was supposed to be a password reset flow
      if (next === "/auth/update-password") {
        router.push("/auth/error?error=No valid token found. Please request a new password reset link.");
      } else {
        router.push("/auth/error?error=No valid token found. Please try again.");
      }
    };

    handleCallback();
  }, [router, searchParams]);

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="text-center">
        <p className="text-muted-foreground">Processing authentication...</p>
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

