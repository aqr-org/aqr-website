import { redirect } from "next/navigation";
import { type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    // If we have a code, redirect to handler which will exchange it client-side
    redirect(`/auth/callback-handler?code=${code}`);
  } else {
    // No code - redirect to handler which will check for hash fragments
    // Supabase PKCE flow redirects with hash fragments that are only available client-side
    redirect("/auth/callback-handler");
  }
}

