import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { beaconDataOf } from "@/lib/utils";
import { Company, CompanyAdminInfo, CompanyArea, CompanyContactInfo, UserBeaconData } from "@/lib/types";
import ProtectedTabs from "@/components/protected-tabs";

export const beaconOrgHasSupabaseOrg = async (beaconOrgName:string) => {
  const supabase = await createClient();
  const check = await supabase
    .from('companies')
    .select('id')
    .eq('name', beaconOrgName)
    .single();
  return check.data !== null;
}

export default async function ProtectedPage() {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims) {
    redirect("/auth/login");
  }

  // const userEmail = 'jessie.granger@2cv.com'
  const userEmail = data.claims.email;
  const userBeaconData = await beaconDataOf(userEmail) as UserBeaconData;

  if ('error' in userBeaconData) {
    // const errorType = userBeaconData.error;
    console.log("Beacon Data error:", userBeaconData?.error || "Unknown error");
    // redirect(`/error?type=${errorType}`);
  }

  const orgExistsOnBoth = await beaconOrgHasSupabaseOrg(userBeaconData.organizations[0]?.name)

  const thisCompanyRecord: {
    admin: CompanyAdminInfo | null;
    data: Company | null;
    areas: CompanyArea[] | null;
    contactInfo: CompanyContactInfo | null;
    logo: string | null;
  } = {
    admin: null,
    data: null,
    areas: null,
    contactInfo: null,
    logo: null,
  }

  if (orgExistsOnBoth) {

    const companyData = await supabase.from("companies")
      .select("*")
      .eq("name", (userBeaconData.organizations && userBeaconData.organizations.length > 0) ? userBeaconData.organizations[0].name : null);
  
    if (companyData.error) {
      console.error("Company Data error:", JSON.stringify(companyData));
    } 

    thisCompanyRecord.data = (companyData.data && companyData.data.length > 0) ? companyData.data[0] : null;
    
    if (!thisCompanyRecord.data) {
      console.error("No company data found for organization:", userBeaconData.organizations[0]?.name);
      return null;
    }
  
    const companyAreas = userBeaconData.hasOrg ? await supabase.from("company_areas")
      .select("id, company_id, area")
      .eq("company_id", thisCompanyRecord.data.id) : { data: [], error: null };
      
    if (companyAreas.error) {
      console.error("Company Areas error:", companyAreas.error);
    }

    thisCompanyRecord.areas = companyAreas.data || null;
  
    const companyContactInfo = userBeaconData.hasOrg ? await supabase.from("company_contact_info")
      .select("*")
      .eq("company_id", thisCompanyRecord.data.id )
      .single() : { data: null, error: null };
    
      if (companyContactInfo.error) {
      console.log("Company Contact Info error:", companyContactInfo.error);
    }
    thisCompanyRecord.contactInfo = companyContactInfo.data || null;
    
    const logo = userBeaconData.hasOrg ? await supabase
      .storage
      .from('images')
      .list('companies', { limit: 1, search: thisCompanyRecord.data.id.toString() }) : { data: [], error: null };
      
    if (logo.error) {
      console.error("Company Logo error:", logo.error);
    }
    
    const logoFileName = logo.data && logo.data.length > 0 ? logo.data[0].name : null;
    const logoUrl = logoFileName ? (await supabase
      .storage
      .from('images')
      .getPublicUrl(`companies/${logoFileName}`)).data.publicUrl : null;
      
    thisCompanyRecord.logo = logoUrl;
    thisCompanyRecord.data = { ...thisCompanyRecord.data, logo: logoUrl } as Company;
  }
    
  const membersInfo = await supabase.from("members")
    .select("*")
    .eq("email", userEmail);
  if (membersInfo.error) {
    console.error("Members Info error:", membersInfo.error);
  }

  return (
      <div className="flex-1 w-full flex flex-col gap-12">

          <h1 className="font-bold text-3xl">Welcome, {data?.claims?.name || "member"}!</h1>
        <section className="flex gap-4">
          <div>
            OrgExistsOnBoth: {orgExistsOnBoth ? 'true' : 'false'}
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
