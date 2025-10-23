import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Company, CompanyArea, CompanyContactInfo } from "@/lib/types/company";
import DirectoryCompanyCard from "@/components/ui/directoryCompanyCard";

export type CompanyWithExtraInfo = Company & {
  company_contact_info?: CompanyContactInfo;
  company_areas?: CompanyArea[];
  ident?: string;
  slug?: string;
};

export interface DirectoryPageLayoutProps {
  title: string;
  subtitle?: string;
  companies: CompanyWithExtraInfo[];
  emptyStateMessage: string;
  emptyStateLinkText?: string;
  emptyStateLinkHref?: string;
}

export default async function DirectoryPageLayout({
  title,
  subtitle,
  companies,
  emptyStateMessage,
  emptyStateLinkText = "Browse all companies",
  emptyStateLinkHref = "/dir"
}: DirectoryPageLayoutProps) {
  const supabase = await createClient();

  // Get all company logos by listing all files in the companies folder
  const allCompanyFiles = await supabase
    .storage
    .from('images')
    .list('companies');
  
  if (allCompanyFiles.error) {
    console.error("Storage error:", allCompanyFiles.error);
  }
  
  // Filter files to only include those that match our company IDs
  const companyIds = companies.map(company => company.id);
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

  // Sort companies alphabetically
  const sortedCompanies = [...companies].sort((a, b) => {
    return a.name.localeCompare(b.name);
  });

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">{title}</h1>
        {subtitle && (
          <p className="text-lg text-gray-600">
            {subtitle}
          </p>
        )}
      </div>
      
      <div className="md:grid md:grid-cols-4 md:gap-5">
        {sortedCompanies.length > 0 ? (
          sortedCompanies.map((company: CompanyWithExtraInfo) => {
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
            <p className="text-xl text-gray-500">{emptyStateMessage}</p>
            <Link href={emptyStateLinkHref} className="text-blue-600 hover:text-blue-800 underline mt-4 inline-block">
              {emptyStateLinkText}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
