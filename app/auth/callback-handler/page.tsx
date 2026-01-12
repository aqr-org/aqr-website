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

      // Check for hash fragments FIRST (Implicit flow or some recovery flows)
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

      // Priority 1: Hash fragments with tokens
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

      // Priority 2: Check for query code parameter (PKCE flow)
      const code = searchParams.get("code");
      if (code) {
        try {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (!error) {
            // After successful code exchange, check if we need to redirect to password reset
            if (next === "/auth/update-password" || type === "recovery") {
              router.push("/auth/update-password");
            } else {
              router.push(next);
            }
            return;
          } else {
            router.push(`/auth/error?error=${encodeURIComponent(error.message)}`);
            return;
          }
        } catch (err) {
          router.push(`/auth/error?error=${encodeURIComponent(err instanceof Error ? err.message : "Failed to exchange code")}`);
          return;
        }
      }

      // Priority 3: Check if user already has a session
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

