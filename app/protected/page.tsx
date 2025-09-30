import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ProtectedTabs from "@/components/protected-tabs";

export default async function ProtectedPage() {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims) {
    redirect("/auth/login");
  }

  // const userEmail = data.claims.email;
  const userEmail = 'nooruddin.ahmed@agroni.co.uk'

  const companiesAdminInfo = await supabase.from("company_admin_info")
    .select("*")
    .eq("adminemail", userEmail);
  if (companiesAdminInfo.error) {
    console.error("Companies Admin Info error:", companiesAdminInfo.error);
  } 

  const companyData = await supabase.from("companies")
    .select("*")
    .eq("id", companiesAdminInfo.data ? companiesAdminInfo.data[0].company_id : null);
  if (companyData.error) {
    console.error("Company Data error:", companyData.error);
  } 

  const companyAreas = await supabase.from("company_areas")
    .select("id, company_id, area")
    .eq("company_id", companiesAdminInfo.data ? companiesAdminInfo.data[0].company_id : null);
  if (companyAreas.error) {
    console.error("Company Areas error:", companyAreas.error);
  } else {
    console.log("Company Areas data:", companyAreas.data);
  }

  const companyContactInfo = await supabase.from("company_contact_info")
    .select("*")
    .eq("company_id", companiesAdminInfo.data ? companiesAdminInfo.data[0].company_id : null)
    .single();
  if (companyContactInfo.error) {
    console.error("Company Contact Info error:", companyContactInfo.error);
  } else {
    console.log("Company Contact Info data:", companyContactInfo.data);
  }
  
  const membersInfo = await supabase.from("members")
    .select("*")
    .eq("email", userEmail);
  if (membersInfo.error) {
    console.error("Members Info error:", membersInfo.error);
  }

  const logo = await supabase
    .storage
    .from('images')
    .list('companies', { limit: 1, search: companyData.data ? companyData.data[0].id.toString() : null });

  if (logo.error) {
    console.error("Company Logo error:", logo.error);
  } else {
    console.log("Company Logo data:", logo.data);
  }

  const logoFileName = logo.data && logo.data.length > 0 ? logo.data[0].name : null;
  const logoUrl = logoFileName ? (await supabase
    .storage
    .from('images')
    .getPublicUrl(`companies/${logoFileName}`)).data.publicUrl : null;


  companyData.data = companyData.data ? [{ ...companyData.data[0], logo: logoUrl }] : null;

  return (
    <div className="flex-1 w-full flex flex-col gap-12">

      <ProtectedTabs
        companiesAdminInfo={companiesAdminInfo}
        companyData={companyData}
        companyAreas={companyAreas}
        companyContactInfo={companyContactInfo}
        membersInfo={membersInfo}
      />
      
    </div>
  );
}
