import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import SuperadminPanel from "@/components/superadmin/SuperadminPanel";
import Background from "@/components/Background";

export default async function SuperadminPage() {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims) redirect("/auth/login");

  const userEmail = data.claims.email;
  const superadminEmail = process.env.SUPERADMIN_EMAIL;
  const normalizedUserEmail = userEmail?.trim().toLowerCase();
  const normalizedSuperadminEmail = superadminEmail?.trim().toLowerCase();

  // Verify user is superadmin (server-side only check)
  if (!superadminEmail || normalizedUserEmail !== normalizedSuperadminEmail) {
    // Not a superadmin, redirect to protected page
    redirect("/protected");
  }

  return (
    <main className="flex-1 w-full max-w-240 mx-auto flex flex-col gap-12">
      <Background/>
      <h1 className="text-3xl">Superuser Admin Panel</h1>
      <SuperadminPanel />
    </main>
  );
}

