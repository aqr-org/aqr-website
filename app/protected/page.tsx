import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { beaconDataOf } from "@/lib/utils";
import { UserBeaconData } from "@/lib/types";
import ProtectedTabs from "@/components/member-settings/protected-tabs";
import Background from "@/components/Background";

export default async function ProtectedPage() {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims) redirect("/auth/login?next=/protected");

  const userEmail = data.claims.email;
  // const userEmail = data.claims.email;
  if (!userEmail) redirect("/auth/login?next=/protected");

  const userBeaconData = (await beaconDataOf(userEmail)) as UserBeaconData;

  // Get all organizations from userBeaconData
  const allOrganizations = userBeaconData.organizations ?? [];
  const orgNames = allOrganizations.map(org => org.name).filter(Boolean);
  
  // Initialize companies array - will include ALL organizations from Beacon
  const companiesArray: Array<{
    admin: null;
    data: any;
    areas: any;
    contactInfo: any;
    logo: string | null;
    organizationId: string;
    organizationName: string;
  }> = [];

  // 1) Fetch all matching companies + related rows in ONE request (use PostgREST relation selects)
  //    This assumes FK relationships exist: company_areas.company_id -> companies.id and company_contact_info.company_id -> companies.id
  //    Result returns companies with nested company_areas and company_contact_info.
  let companiesWithRelations: any[] = [];
  if (orgNames.length > 0) {
    const { data: fetchedCompanies } = await supabase
      .from("companies")
      .select(`
        *,
        company_areas(id, company_id, area),
        company_contact_info(*)
      `)
      .in("name", orgNames);
    
    companiesWithRelations = fetchedCompanies || [];
  }

  // Create a map of Supabase companies by name for quick lookup
  const supabaseCompaniesMap = new Map<string, any>();
  companiesWithRelations.forEach((company) => {
    if (company?.name) {
      supabaseCompaniesMap.set(company.name, company);
    }
  });

  // 2) Fetch logos for all companies that exist in Supabase
  const logoPromises = companiesWithRelations.map(async (company) => {
    let logoUrl: string | null = null;
    if (company?.id) {
      const imagesList = await supabase.storage
        .from("images")
        .list("companies", { limit: 1, search: company.id.toString() });

      if (!imagesList.error && imagesList.data?.length) {
        const name = imagesList.data[0].name;
        logoUrl = (await supabase.storage.from("images").getPublicUrl(`companies/${name}`)).data.publicUrl;
      }
    }
    return { companyName: company.name, logoUrl };
  });

  const logoResults = await Promise.all(logoPromises);
  const logoMap = new Map<string, string | null>();
  logoResults.forEach(({ companyName, logoUrl }) => {
    if (companyName) {
      logoMap.set(companyName, logoUrl);
    }
  });

  // 3) Build array of company records for ALL organizations from Beacon
  //    Include organizations that don't exist in Supabase yet (with null data)
  allOrganizations.forEach((org) => {
    const supabaseCompany = supabaseCompaniesMap.get(org.name);
    const logoUrl = logoMap.get(org.name) ?? null;

    companiesArray.push({
      admin: null,
      data: supabaseCompany ?? null, // null if company doesn't exist in Supabase yet
      areas: supabaseCompany?.company_areas ?? null,
      contactInfo: supabaseCompany?.company_contact_info ?? null,
      logo: logoUrl,
      organizationId: org.id,
      organizationName: org.name,
    });
  });

  // 2) Parallelize fetching members (independent)
  const membersInfo = await supabase.from("members").select("*").eq("email", userEmail);

  return (
    <div className="flex-1 w-full flex flex-col gap-12">
        <h1 className="text-lg md:text-3xl">Welcome, {userBeaconData?.firstname || "member"}!</h1>

        <ProtectedTabs
          companies={companiesArray}
          membersInfo={membersInfo}
          userEmail={userEmail}
          userBeaconData={userBeaconData}
        />
        
      </div>
  );
}
