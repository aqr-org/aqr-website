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
  // const userEmail = data.claims.email;
  if (!userEmail) redirect("/auth/login");

  const userBeaconData = (await beaconDataOf(userEmail)) as UserBeaconData;

  const orgName = userBeaconData.organizations?.[0]?.name ?? null;

  // 1) Check existence and fetch company + related rows in ONE request (use PostgREST relation selects)
  //    This assumes FK relationships exist: company_areas.company_id -> companies.id and company_contact_info.company_id -> companies.id
  //    Result returns company with nested company_areas and company_contact_info.
  const { data: companyWithRelations } = await supabase
    .from("companies")
    .select(`
      *,
      company_areas(id, company_id, area),
      company_contact_info(*)
    `)
    .eq("name", orgName)
    .maybeSingle(); // returns single object or null

  const orgExistsOnBoth = !!companyWithRelations;

  // 2) Parallelize fetching members (independent) and storage listing (dependent on company presence)
  const membersInfo = await supabase.from("members").select("*").eq("email", userEmail);

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
        <h1 className="text-lg md:text-3xl">Welcome, {userBeaconData?.firstname || "member"}!</h1>
        {/* <section className="flex gap-4">
          <div>
            <pre>
              UserBeaconData:
              {JSON.stringify(userBeaconData, null, 2)}
            </pre>
          </div>
          <pre>
            {JSON.stringify(thisCompanyRecord.data, null, 2)}
          </pre>
        </section> */}

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
