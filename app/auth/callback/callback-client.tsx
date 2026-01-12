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
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (!error) {
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
