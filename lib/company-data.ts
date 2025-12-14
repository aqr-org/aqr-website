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
  mapref?: string | null;
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
    
    // Use PostgREST relations to fetch company with nested data in a single query
    const { data: companyData, error: companyError } = await supabase
      .from('companies')
      .select(`
        *,
        company_contact_info(*),
        company_areas(*)
      `)
      .or(`ident.eq.${slug},and(ident.is.null,slug.eq.${slug})`)
      .single();

    if (companyError) {
      console.error("Company error:", companyError);
      return null;
    }

    if (!companyData?.id) {
      return null;
    }

    // Extract nested data from the relation query
    // Handle both array and single object cases for company_contact_info
    // Supabase returns relations as arrays, so we take the first element
    const companyContactInfoRaw = (companyData as any).company_contact_info;
    const companyContactInfo = Array.isArray(companyContactInfoRaw) 
      ? (companyContactInfoRaw.length > 0 ? companyContactInfoRaw[0] : null)
      : (companyContactInfoRaw || null);
    const companyAreas = (companyData as any).company_areas || [];

    // Fetch employees and logo in parallel (these can't be joined via relations)
    const [companyEmployees, companyLogo] = await Promise.all([
      supabase
        .from('members')
        .select('id, firstname, lastname, organisation, slug')
        .eq('organisation', companyData.name)
        .eq('beacon_membership_status', 'Active'),
      supabase
        .storage
        .from('images')
        .list('companies', { limit: 1, search: companyData.id.toString() })
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

  // Fetch area categories if we have areas
  let areasByCategory: {[key: string]: string[]} = {};
  
  if (companyAreas && companyAreas.length > 0) {
    const areaNames = companyAreas.map((area: CompanyArea) => area.area);
    
    const { data: areasWithCategories, error: categoriesError } = await supabase
      .from('areas_master')
      .select('area, category')
      .in('area', areaNames);

    if (categoriesError) {
      console.error("Categories error:", categoriesError);
    } else {
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
      ...companyData,
      // Ensure all required fields are strings as expected by Company component
      type: companyData.type || '',
      narrative: companyData.narrative || '',
      companysize: companyData.companysize || '',
      established: companyData.established?.toString() || '',
      gradprog: companyData.gradprog || '',
      contact_info: companyContactInfo ? {
        id: companyContactInfo.id || '',
        company_id: companyContactInfo.company_id || '',
        email: companyContactInfo.email || '',
        phone: companyContactInfo.phone || '',
        mobile: companyContactInfo.mobile,
        addr1: companyContactInfo.addr1,
        addr2: companyContactInfo.addr2,
        addr3: companyContactInfo.addr3,
        addr4: companyContactInfo.addr4,
        addr5: companyContactInfo.addr5,
        postcode: companyContactInfo.postcode,
        country: companyContactInfo.country,
        facebook: companyContactInfo.facebook,
        linkedin: companyContactInfo.linkedin,
        twitter: companyContactInfo.twitter,
        youtube: companyContactInfo.youtube,
        website: companyContactInfo.website,
        mapref: companyContactInfo.mapref || null,
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
