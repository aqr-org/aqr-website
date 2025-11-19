import { UpdatePasswordForm } from "@/components/update-password-form";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function Page() {
  const supabase = await createClient();
  
  // Check if user has a valid session (required for password reset)
  const { data: { session }, error } = await supabase.auth.getSession();
  
  if (error || !session) {
    // No session found, redirect to forgot password page
    redirect("/auth/forgot-password?error=Invalid or expired session. Please request a new password reset link.");
  }

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <UpdatePasswordForm />
      </div>
    </div>
  );
}
