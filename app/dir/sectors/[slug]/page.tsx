import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Metadata } from "next";
import { Company, CompanyArea, CompanyContactInfo } from "@/lib/types/company";
import DirectoryCompanyCard from "@/components/ui/directoryCompanyCard";

type CompanyWithExtraInfo = Company & {
  company_contact_info?: CompanyContactInfo;
  company_areas?: CompanyArea[];
  ident?: string;
  slug?: string;
};

interface PageProps {
  params: {
    slug: string;
  };
}

export async function generateMetadata(
  { params }: PageProps
): Promise<Metadata> {
  // Convert slug back to sector name for display
  const resolvedParams = await params;
  const sectorName = resolvedParams.slug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  return {
    title: `${sectorName} Companies - AQR Business Directory`,
    description: `Browse ${sectorName} companies in the AQR Business Directory`,
    openGraph: {
      title: `${sectorName} Companies`,
      description: `Browse ${sectorName} companies in the AQR Business Directory`,
    },
  }
}

export default async function SectorPage({ params }: PageProps) {
  const resolvedParams = await params;
  const { slug } = resolvedParams;
  
  // Convert slug back to sector name for database query
  const sectorName = slug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  // Fetch initial data in parallel
  const [supabase] = await Promise.all([
    createClient()
  ]);
  
  // Fetch companies where type matches the sector name
  const companies = await supabase
    .from('companies')
    .select('*')
    .eq('beacon_membership_status', 'Active')
    .eq('type', sectorName);

  if (companies.error) {
    console.error("Companies error:", companies.error);
  }

  // Get all company logos by listing all files in the companies folder
  const allCompanyFiles = await supabase
    .storage
    .from('images')
    .list('companies');
  
  if (allCompanyFiles.error) {
    console.error("Storage error:", allCompanyFiles.error);
  }
  
  // Filter files to only include those that match our company IDs
  const companyIds = companies.data?.map(company => company.id) || [];
  const filteredLogos = allCompanyFiles.data?.filter(file => {
    // Extract the file name without extension
    const fileNameWithoutExt = file.name.replace(/\.(jpg|jpeg|png|gif)$/i, '');
    return companyIds.includes(fileNameWithoutExt);
  }) || [];
  
  // Generate public URLs for each logo
  const companyLogos = filteredLogos.map(file => {
    const { data } = supabase.storage
      .from('images')
      .getPublicUrl(`companies/${file.name}`);
    
    return {
      ...file,
      publicUrl: data.publicUrl
    };
  });

  // Fetch company contact info and areas in parallel
  const [company_contact_info, company_areas] = await Promise.all([
    companies.data 
      ? supabase.from('company_contact_info').select('*').in('company_id', companies.data.map(company => company.id))
      : Promise.resolve({ data: [], error: null }),
    companies.data 
      ? supabase.from('company_areas').select('*').in('company_id', companies.data.map(company => company.id))
      : Promise.resolve({ data: [], error: null })
  ]);

  // More robust error handling
  if (company_contact_info.error) {
    console.error("Company contact info error:", company_contact_info.error);
  }
  if (company_areas.error) {
    console.error("Company areas error:", company_areas.error);
  }

  // Add the company_contact_info to the companies.data
  companies.data?.forEach(company => {
    const thiscompany_contact_info = company_contact_info.data?.find(contact => contact.company_id === company.id);
    company.company_contact_info = thiscompany_contact_info;
  });

  // Add the company_areas to the companies.data
  companies.data?.forEach(company => {
    const thiscompany_areas = company_areas.data?.filter(area => area.company_id === company.id);
    company.company_areas = thiscompany_areas;
  });

  const companiesWithActiveSubs = companies.data ? [...companies.data] : [];

  companiesWithActiveSubs.sort((a, b) => {
    return a.name.localeCompare(b.name);
  });
  
  return (
    <>
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">{sectorName} Companies</h1>
        <p className="text-lg text-gray-600">
          {companiesWithActiveSubs.length} {companiesWithActiveSubs.length === 1 ? 'company' : 'companies'} found
        </p>
      </div>
      
      <div className="md:grid md:grid-cols-4 md:gap-5">
        {companiesWithActiveSubs.length > 0 ? (
          companiesWithActiveSubs.map((company: CompanyWithExtraInfo) => {
            const finalSlug = company.ident || company.slug;
            
            // Find the logo for this company
            const logo = companyLogos.find(logo => {
              const fileNameWithoutExt = logo.name.replace(/\.(jpg|jpeg|png|gif)$/i, '');
              return fileNameWithoutExt === company.id;
            });

            // Transform data for DirectoryCompanyCard
            const companyData = {
              id: company.id,
              name: company.name,
              type: company.type || '',
              slug: finalSlug || '',
              logo: logo ? { publicUrl: logo.publicUrl } : { publicUrl: '' }
            };

            return (
              <DirectoryCompanyCard 
                key={company.id} 
                company={companyData}
              />
            );
          })
        ) : (
          <div className="col-span-4 text-center py-12">
            <p className="text-xl text-gray-500">No companies found in the {sectorName} sector.</p>
            <Link href="/dir" className="text-blue-600 hover:text-blue-800 underline mt-4 inline-block">
              Browse all companies
            </Link>
          </div>
        )}
      </div>            
    </>
  );
}
