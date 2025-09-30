import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Suspense } from "react";
import { LoadingAnimation } from "@/components/ui/loading-animation";

export default async function ComnpaniesPage() {
  const supabase = await createClient();

  // Use Promise.all to prevent waterfall - both requests run in parallel
  const [companies, contactInfo] = await Promise.all([
    supabase.from('companies').select('*'),
    supabase.from('company_contact_info').select('*')
  ]);

  if (companies.error) {
    console.error("Companies error:", companies.error);
  }

  if (contactInfo.error) {
    console.error("Contact info error:", contactInfo.error);
  }

  companies.data?.sort((a, b) => {
    return a.name.localeCompare(b.name);
  });

  return (
    <div>
      <h1>Companies List</h1>
      <div className="mb-4">
        {companies.error && <p className="text-red-500">Companies error: {companies.error.message}</p>}
        {contactInfo.error && <p className="text-red-500">Contact info error: {contactInfo.error.message}</p>}
      </div>
      <Suspense fallback={<LoadingAnimation text="Loading companies..." />}>
        <div className="columns-5">
          {companies.data && companies.data.length > 0 ? (
            companies.data.map(company => {
              return (
                <Link key={company.id} href={`/companies/${company.ident}`}>
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