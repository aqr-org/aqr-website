import { createClient } from "@/lib/supabase/server";
import { Company, CompanyArea, CompanyContactInfo } from "@/lib/types/company";

export type CompanyWithExtraInfo = Company & {
  company_contact_info?: CompanyContactInfo;
  company_areas?: CompanyArea[];
  ident?: string;
  slug?: string;
};

export async function fetchCompaniesWithExtraData(companyIds: string[]): Promise<CompanyWithExtraInfo[]> {
  const supabase = await createClient();

  // Fetch companies that are active and match the provided IDs
  const companies = await supabase
    .from('companies')
    .select('*')
    .eq('beacon_membership_status', 'Active')
    .in('id', companyIds);

  if (companies.error) {
    console.error("Companies error:", companies.error);
    return [];
  }

  if (!companies.data || companies.data.length === 0) {
    return [];
  }

  // Fetch company contact info and areas in parallel
  const [company_contact_info, company_areas] = await Promise.all([
    supabase.from('company_contact_info').select('*').in('company_id', companies.data.map(company => company.id)),
    supabase.from('company_areas').select('*').in('company_id', companies.data.map(company => company.id))
  ]);

  // More robust error handling
  if (company_contact_info.error) {
    console.error("Company contact info error:", company_contact_info.error);
  }
  if (company_areas.error) {
    console.error("Company areas error:", company_areas.error);
  }

  // Add the company_contact_info to the companies.data
  companies.data.forEach(company => {
    const thiscompany_contact_info = company_contact_info.data?.find(contact => contact.company_id === company.id);
    company.company_contact_info = thiscompany_contact_info;
  });

  // Add the company_areas to the companies.data
  companies.data.forEach(company => {
    const thiscompany_areas = company_areas.data?.filter(area => area.company_id === company.id);
    company.company_areas = thiscompany_areas;
  });

  return companies.data;
}
