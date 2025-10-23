import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Metadata } from "next";
import { Company, CompanyArea, CompanyContactInfo } from "@/lib/types/company";
import React from "react";
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
  // Get the area name from the slug
  const resolvedParams = await params;
  const areaName = resolvedParams.slug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  return {
    title: `${areaName} Expertise - AQR Business Directory`,
    description: `Browse companies with ${areaName} expertise in the AQR Business Directory`,
    openGraph: {
      title: `${areaName} Expertise`,
      description: `Browse companies with ${areaName} expertise in the AQR Business Directory`,
    },
  }
}

export default async function ExpertisePage({ params }: PageProps) {
  const resolvedParams = await params;
  const { slug } = resolvedParams;

  // Fetch initial data in parallel
  const [supabase] = await Promise.all([
    createClient()
  ]);
  
  // First, get all company areas to find the area name from the slug
  const companyAreas = await supabase
    .from('company_areas')
    .select('*')
    .eq('slug', slug);

  if (companyAreas.error) {
    console.error("Company areas error:", companyAreas.error);
  }

  // Get the area name from the first matching area
  const areaName = companyAreas.data?.[0]?.area || slug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  // Get company IDs that have this area
  const companyIdsWithArea = companyAreas.data?.map(area => area.company_id) || [];
  
  // Fetch companies that have this area assigned and are active
  const companies = await supabase
    .from('companies')
    .select('*')
    .eq('beacon_membership_status', 'Active')
    .in('id', companyIdsWithArea);

  if (companies.error) {
    console.error("Companies error:", companies.error);
  }

  // Get all company logos by listing all files in the companies folder
  // and filtering by company IDs
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

  // Group companies by first letter with special grouping for numbers and rare letters
  const groupedCompanies = companiesWithActiveSubs.reduce((acc, company) => {
    const firstChar = company.name.charAt(0).toUpperCase();
    let groupKey: string;
    
    // Group all numbers 0-9 together
    if (/[0-9]/.test(firstChar)) {
      groupKey = '0-9';
    }
    // Group letters X, Y, Z together
    else if (['X', 'Y', 'Z'].includes(firstChar)) {
      groupKey = 'X-Z';
    }
    // All other letters get their own group
    else {
      groupKey = firstChar;
    }
    
    if (!acc[groupKey]) {
      acc[groupKey] = [];
    }
    acc[groupKey].push(company);
    return acc;
  }, {} as Record<string, CompanyWithExtraInfo[]>);
  
  return (
    <>
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">{areaName} Expertise</h1>
        <p className="text-lg text-gray-600">
          {companiesWithActiveSubs.length} {companiesWithActiveSubs.length === 1 ? 'company' : 'companies'} found
        </p>
      </div>
      
      <div className="md:grid md:grid-cols-4 md:gap-5">
        {Object.keys(groupedCompanies).length > 0 ? (
          Object.keys(groupedCompanies)
            .sort((a, b) => {
              // Special sorting for group keys
              if (a === '0-9') return 1; // Numbers first
              if (b === '0-9') return -1;
              if (a === 'X-Z') return 1; // X-Z last
              if (b === 'X-Z') return -1;
              return a.localeCompare(b); // Regular alphabetical for letters
            })
            .map((letter) => (
              <React.Fragment key={letter}>
                {groupedCompanies[letter].map((company: CompanyWithExtraInfo) => {
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
                })}
              </React.Fragment>
            ))
        ) : (
          <div className="col-span-2 text-center py-12">
            <p className="text-xl text-gray-500">No companies found with {areaName} expertise.</p>
            <Link href="/dir" className="text-blue-600 hover:text-blue-800 underline mt-4 inline-block">
              Browse all companies
            </Link>
          </div>
        )}
      </div>            
    </>
  );
}
