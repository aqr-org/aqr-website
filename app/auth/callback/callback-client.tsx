"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function CallbackClient({ next }: { next?: string }) {
  const router = useRouter();

  useEffect(() => {
    const handleHashCallback = async () => {
      const supabase = createClient();

      // Check for hash fragments (Implicit flow or some recovery flows)
      // Supabase redirects with hash fragments like: #access_token=...&refresh_token=...&type=recovery
      const hash = window.location.hash.substring(1);
      if (!hash) {
        // No hash and no code (since this component is only rendered if no code was found by the server)
        router.push("/auth/login");
        return;
      }

      const hashParams = new URLSearchParams(hash);
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

      if (accessToken && refreshToken) {
        try {
          const { error, data } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (!error) {
            // Check if this is a signup confirmation
            if (type === "signup") {
              // This is a signup confirmation - redirect to success page
              router.push("/auth/confirm-success");
              return;
            }
            
            // Check if user's email was just confirmed (within last 30 seconds)
            // This helps detect signup confirmations even if the type parameter isn't preserved
            if (data?.user?.email_confirmed_at) {
              const confirmedAt = new Date(data.user.email_confirmed_at).getTime();
              const now = Date.now();
              const timeSinceConfirmation = now - confirmedAt;
              
              // If email was confirmed within the last 30 seconds and it's not a recovery or magic link flow,
              // treat as signup confirmation
              if (timeSinceConfirmation < 30000 && type !== "recovery" && type !== "magiclink" && next !== "/auth/update-password") {
                router.push("/auth/confirm-success");
                return;
              }
            }
            
            if (type === "recovery" || next === "/auth/update-password") {
              router.push("/auth/update-password");
            } else {
              router.push(next || "/protected");
            }
          } else {
            router.push(`/auth/error?error=${encodeURIComponent(error.message)}`);
          }
        } catch (err) {
          router.push(`/auth/error?error=${encodeURIComponent(err instanceof Error ? err.message : "Failed to set session")}`);
        }
      } else {
        // No valid tokens in hash either
        router.push("/auth/login");
      }
    };

    handleHashCallback();
  }, [router, next]);

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="text-center">
        <p className="text-muted-foreground">Processing authentication...</p>
      </div>
    </div>
  );
}
