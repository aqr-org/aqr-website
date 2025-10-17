import { cache } from 'react';
import { createClient } from '@/lib/supabase/server';

export interface CompanyData {
  id: string;
  name: string;
  type: string;
  narrative: string;
  companysize: string;
  established: string;
  gradprog: string;
  proforgs?: string;
  prsaward?: string;
  accred?: string;
  slug?: string;
  ident?: string;
  [key: string]: unknown; // Allow for other company fields
}

export interface CompanyContactInfo {
  id: string;
  company_id: string;
  email: string;
  phone: string;
  mobile?: string;
  addr1?: string;
  addr2?: string;
  addr3?: string;
  addr4?: string;
  addr5?: string;
  postcode?: string;
  country?: string;
  facebook?: string;
  linkedin?: string;
  twitter?: string;
  youtube?: string;
  website?: string;
}

export interface CompanyArea {
  area: string;
}

export interface CompanyEmployee {
  id: string;
  firstname: string;
  lastname: string;
  organisation: string;
  slug: string;
}

export interface AreaWithCategory {
  area: string;
  category: string;
}

export interface FullCompanyData extends CompanyData {
  contact_info: CompanyContactInfo | null;
  employees: CompanyEmployee[];
  areas: { [key: string]: string[] };
  logo: { data: { publicUrl: string } | null };
}

export const getCompanyData = cache(async (slug: string): Promise<FullCompanyData | null> => {
  try {
    const supabase = await createClient();
    
    // First, get the company data (this is required for subsequent queries)
    const company = await supabase
      .from('companies')
      .select('*')
      .or(`ident.eq.${slug},and(ident.is.null,slug.eq.${slug})`)
      .single();

    if (company.error) {
      console.error("Company error:", company.error);
      return null;
    }

    if (!company.data?.id) {
      return null;
    }

  // Run all dependent queries in parallel
  const [companyContactInfo, companyAreas, companyEmployees, companyLogo] = await Promise.all([
    supabase
      .from('company_contact_info')
      .select('*')
      .eq('company_id', company.data.id)
      .single(),
    supabase
      .from('company_areas')
      .select('area')
      .eq('company_id', company.data.id),
    supabase
      .from('members')
      .select('id, firstname, lastname, organisation, slug')
      .eq('organisation', company.data.name),
    supabase
      .storage
      .from('images')
      .list('companies', { limit: 1, search: company.data.id.toString() })
  ]);

  // Get logo URL if logo exists
  let companyLogoData: { data: { publicUrl: string } | null } = { data: null };
  if (companyLogo.data && companyLogo.data.length > 0) {
    const { data: logoUrlData } = await supabase
      .storage
      .from('images')
      .getPublicUrl(`companies/${companyLogo.data[0].name}`);
    companyLogoData = { data: { publicUrl: logoUrlData.publicUrl } };
  }

  // Log results
  if (companyContactInfo.error) {
    console.log("Company contact info error:", companyContactInfo.error);
  } else {
    // console.log("Company contact info:", companyContactInfo.data);
  }

  if (companyAreas.error) {
    console.error("Company areas error:", companyAreas.error);
  } else {
    // console.log("Company areas:", companyAreas.data);
  }

  // Fetch area categories if we have areas
  let areasByCategory: {[key: string]: string[]} = {};
  
  if (companyAreas.data && companyAreas.data.length > 0) {
    const areaNames = companyAreas.data.map(area => area.area);
    
    const { data: areasWithCategories, error: categoriesError } = await supabase
      .from('areas_master')
      .select('area, category')
      .in('area', areaNames);

    if (categoriesError) {
      console.error("Categories error:", categoriesError);
    } else {
      // console.log("Areas with categories:", areasWithCategories);
      
      // Group areas by category
      areasByCategory = areasWithCategories?.reduce((acc, areaObj) => {
        const category = areaObj.category || 'Uncategorized';
        if (!acc[category]) {
          acc[category] = [];
        }
        acc[category].push(areaObj.area);
        return acc;
      }, {} as {[key: string]: string[]}) || {};
    }
  }

    return {
      ...company.data,
      // Ensure all required fields are strings as expected by Company component
      type: company.data.type || '',
      narrative: company.data.narrative || '',
      companysize: company.data.companysize || '',
      established: company.data.established?.toString() || '',
      gradprog: company.data.gradprog || '',
      contact_info: companyContactInfo.data ? {
        id: companyContactInfo.data.id || '',
        company_id: companyContactInfo.data.company_id || '',
        email: companyContactInfo.data.email || '',
        phone: companyContactInfo.data.phone || '',
        mobile: companyContactInfo.data.mobile,
        addr1: companyContactInfo.data.addr1,
        addr2: companyContactInfo.data.addr2,
        addr3: companyContactInfo.data.addr3,
        addr4: companyContactInfo.data.addr4,
        addr5: companyContactInfo.data.addr5,
        postcode: companyContactInfo.data.postcode,
        country: companyContactInfo.data.country,
        facebook: companyContactInfo.data.facebook,
        linkedin: companyContactInfo.data.linkedin,
        twitter: companyContactInfo.data.twitter,
        youtube: companyContactInfo.data.youtube,
        website: companyContactInfo.data.website,
      } : null,
      employees: companyEmployees.data || [],
      areas: areasByCategory || [],
      logo: companyLogoData
    };
  } catch (error) {
    console.error("Error in getCompanyData:", error);
    return null;
  }
});
