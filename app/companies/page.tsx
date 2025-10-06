import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Suspense } from "react";
import { LoadingAnimation } from "@/components/ui/loading-animation";

export default async function ComnpaniesPage() {
  const supabase = await createClient();

  const [companies] = await Promise.all([
    supabase.from('companies').select('*').eq('beacon_membership_status', 'Active')
  ]);

  if (companies.error) {
    console.error("Companies error:", companies.error);
  }

  const companiesWithActiveSubs = companies.data ? [...companies.data] : [];

  companiesWithActiveSubs.sort((a, b) => {
    return a.name.localeCompare(b.name);
  });
  
  return (
    <div>
      <h1>Companies List</h1>
      <div className="mb-4">
        {companies.error && <p className="text-red-500">Companies error: {companies.error.message}</p>}
      </div>
      <Suspense fallback={<LoadingAnimation text="Loading companies..." />}>
        <div className="columns-5">
          {companiesWithActiveSubs && companiesWithActiveSubs.length > 0 ? (
            companiesWithActiveSubs.map(company => {
              const finalSlug = company.ident || company.slug;
              return (
                <Link key={company.id} href={`/companies/${finalSlug}`}>
                  <h2>{company.name}</h2>
                </Link>
              );
            })
          ) : (
            <p>No companies available.</p>
          )}
        </div>
      </Suspense>
    </div>
  );
}