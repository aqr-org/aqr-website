import { createClient } from '@/lib/supabase/server'
import Company from '@/components/Company'

export default async function ComnpaniesPage({
  params
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  const supabase = await createClient();
  
  // First, get the company data (this is required for subsequent queries)
  const company = await supabase
    .from('companies')
    .select('*')
    .eq('ident', slug)
    .single();

  if (company.error) {
    console.error("Company error:", company.error);
  }

  // If no company found, return early
  if (!company.data?.id) {
    return (
      <div>
        <h1>Company Detail Page for slug: {slug}</h1>
        <div className="mb-4">
          <p className="text-red-500">Company not found</p>
        </div>
      </div>
    )
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

  const companyLogoUrl =  companyLogo.data && companyLogo.data.length > 0 && await supabase
        .storage
        .from('images')
        .getPublicUrl(`companies/${companyLogo.data[0].name}`);

  // Log results
  if (companyContactInfo.error) {
    console.error("Company contact info error:", companyContactInfo.error);
  } else {
    console.log("Company contact info:", companyContactInfo.data);
  }

  if (companyAreas.error) {
    console.error("Company areas error:", companyAreas.error);
  } else {
    console.log("Company areas:", companyAreas.data);
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
      console.log("Areas with categories:", areasWithCategories);
      
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

  const companyData = {
    ...company.data,
    contact_info: companyContactInfo.data || null,
    employees: companyEmployees.data || [],
    areas: areasByCategory || [],
    logo: companyLogoUrl
  }

  return (
    <>
        <Company data={companyData} />
    </>
  )
}