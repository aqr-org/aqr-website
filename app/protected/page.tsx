import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { beaconDataOf } from "@/lib/utils";
import { UserBeaconData } from "@/lib/types";
import ProtectedTabs from "@/components/member-settings/protected-tabs";
import Background from "@/components/Background";

export default async function ProtectedPage() {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims) redirect("/auth/login");

  const userEmail = data.claims.email;
  const userBeaconData = (await beaconDataOf(userEmail)) as UserBeaconData;

  if ('error' in userBeaconData) {
    console.log("Beacon Data error:", userBeaconData?.error || "Unknown error");
  }

  const orgName = userBeaconData.organizations?.[0]?.name ?? null;

  // 1) Check existence and fetch company + related rows in ONE request (use PostgREST relation selects)
  //    This assumes FK relationships exist: company_areas.company_id -> companies.id and company_contact_info.company_id -> companies.id
  //    Result returns company with nested company_areas and company_contact_info.
  const { data: companyWithRelations, error: companyErr } = await supabase
    .from("companies")
    .select(`
      *,
      company_areas(id, company_id, area),
      company_contact_info(*)
    `)
    .eq("name", orgName)
    .maybeSingle(); // returns single object or null

  if (companyErr) {
    console.error("Company with relations error:", companyErr);
  }

  const orgExistsOnBoth = !!companyWithRelations;

  // 2) Parallelize fetching members (independent) and storage listing (dependent on company presence)
  const membersPromise = supabase.from("members").select("*").eq("email", userEmail);

  let logoUrl: string | null = null;
  if (orgExistsOnBoth && companyWithRelations?.id) {
    // If you store logo filename or path in companies table, use that instead of storage.list
    // Fallback to storage.list only if necessary
    const imagesList = await supabase.storage
      .from("images")
      .list("companies", { limit: 1, search: companyWithRelations.id.toString() });

    if (!imagesList.error && imagesList.data?.length) {
      const name = imagesList.data[0].name;
      logoUrl = (await supabase.storage.from("images").getPublicUrl(`companies/${name}`)).data.publicUrl;
    }
  }

  const membersInfo = await membersPromise;
  if (membersInfo.error) console.error("Members Info error:", membersInfo.error);

  // Build a compact company record from the single response
  const thisCompanyRecord = {
    admin: null,
    data: companyWithRelations ?? null,
    areas: companyWithRelations?.company_areas ?? null,
    contactInfo: companyWithRelations?.company_contact_info ?? null,
    logo: logoUrl,
  };

  return (
    <div className="flex-1 w-full flex flex-col gap-12">
        <Background
          css={`
            body { background-image: linear-gradient(to bottom, rgba(0,0,0,0) 10vw, rgba(0,50,0,0.2) 100vw); }
          `}
        />
        <h1 className="text-3xl">Welcome, {membersInfo.data?.[0]?.firstname || "member"}!</h1>
        <section className="flex gap-4">
          <div>
            <pre>
              UserBeaconData:
              {JSON.stringify(userBeaconData, null, 2)}
            </pre>
          </div>
          <pre>
            {JSON.stringify(thisCompanyRecord.data, null, 2)}
          </pre>
        </section>

        <ProtectedTabs
          companyData={thisCompanyRecord.data}
          companyAreas={thisCompanyRecord.areas}
          companyContactInfo={thisCompanyRecord.contactInfo}
          membersInfo={membersInfo}
          userEmail={userEmail}
          userBeaconData={userBeaconData}
        />
        
      </div>
  );
}
