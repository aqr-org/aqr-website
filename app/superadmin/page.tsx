import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import SuperadminPanel from "@/components/superadmin/SuperadminPanel";

export default async function SuperadminPage() {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims) redirect("/auth/login");

  const userEmail = data.claims.email;
  const superadminEmail = process.env.SUPERADMIN_EMAIL;
  const superadminEmail2 = process.env.SUPERADMIN_EMAIL2;
  const normalizedUserEmail = userEmail?.trim().toLowerCase();
  const normalizedSuperadminEmail = superadminEmail?.trim().toLowerCase();
  const normalizedSuperadminEmail2 = superadminEmail2?.trim().toLowerCase();

  // Verify user is superadmin (server-side only check)
  const isSuperadmin = 
    (superadminEmail && normalizedUserEmail === normalizedSuperadminEmail) ||
    (superadminEmail2 && normalizedUserEmail === normalizedSuperadminEmail2);
  
  if (!isSuperadmin) {
    // Not a superadmin, redirect to protected page
    redirect("/protected");
  }

  return (
    <main className="flex-1 w-full max-w-240 mx-auto flex flex-col gap-12">
      <h1 className="text-3xl">Superuser Admin Panel</h1>
      <SuperadminPanel />
    </main>
  );
}

