import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Suspense } from "react";
import { LoadingAnimation } from "@/components/ui/loading-animation";

export default async function ComnpaniesPage() {
  const supabase = await createClient();

  // Use Promise.all to prevent waterfall - both requests run in parallel
  const [members] = await Promise.all([
    supabase.from('members').select('*'),
  ]);

  if (members.error) {
    console.error("Companies error:", members.error);
  }
  
  members.data?.sort((a, b) => {
    const nameA = `${a.lastname} ${a.firstname}`.toLowerCase();
    const nameB = `${b.lastname} ${b.firstname}`.toLowerCase();
    return nameA.localeCompare(nameB);
  });

  return (
    <div>
      <h1>Members List</h1>
      <Suspense 
        fallback={
              <LoadingAnimation text="Loading members..." />
        }
      >
        <div className="columns-5">
            {members.data && members.data.length > 0 ? (
              members.data.map(member => {
                return (
                  <div 
                    key={member.id}
                    className="mb-4 break-inside-avoid-column"
                  >
                    <Link href={`/members/${member.slug}`}>
                      <h2>{member.lastname}, {member.firstname} </h2>
                      <p className="text-sm">{member.organisation}</p>
                    </Link>
                  </div>
                );
              })
            ) : (
              <p>No members available.</p>
            )}
        </div>
      </Suspense>
    </div>
  );
}