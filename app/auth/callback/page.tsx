"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function CallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const handleCallback = async () => {
      const supabase = createClient();

      // Check for hash fragments (PKCE flow with access_token)
      // Supabase redirects with hash fragments like: #access_token=...&refresh_token=...&type=recovery
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = hashParams.get("access_token");
      const refreshToken = hashParams.get("refresh_token");
      const type = hashParams.get("type");
      const errorParam = hashParams.get("error");
      const errorDescription = hashParams.get("error_description");

      // If there's an error in the hash, handle it
      if (errorParam) {
        router.push(`/auth/error?error=${encodeURIComponent(errorDescription || errorParam)}`);
        return;
      }

      // Priority 1: Hash fragments with tokens (PKCE recovery flow)
      if (accessToken && refreshToken) {
        try {
          // Set the session using the tokens from hash fragments
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (!error) {
            // Successfully set session, redirect to update password page
            router.push("/auth/update-password");
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

      // Priority 2: Check if user already has a session (might have been set by middleware)
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        router.push("/auth/update-password");
        return;
      }

      // No valid token or session found
      router.push("/auth/error?error=No valid token found. Please request a new password reset link.");
    };

    handleCallback();
  }, [router]);

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="text-center">
        <p className="text-muted-foreground">Processing password reset...</p>
      </div>
    </div>
  );
}

