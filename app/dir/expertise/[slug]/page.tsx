import { createClient } from "@/lib/supabase/server";
import { Metadata } from "next";
import DirectoryPageLayout from "@/components/DirectoryPageLayout";
import { fetchCompaniesWithExtraData } from "@/lib/directory-utils";

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
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

  const supabase = await createClient();
  
  // First, get all company areas to find the area name from the slug
  const companyAreas = await supabase
    .from('company_areas')
    .select('*')
    .eq('slug', slug);

  if (companyAreas.error) {
    console.error("Company areas error:", companyAreas.error);
  }

  // Get the area name from the first matching area
  const areaName = companyAreas?.data?.[0]?.area || slug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  // Get company IDs that have this area
  const companyIdsWithArea = companyAreas.data?.map(area => area.company_id) || [];
  
  const companiesWithExtraData = await fetchCompaniesWithExtraData(companyIdsWithArea);
  
  return (
    <DirectoryPageLayout
      title={`${areaName} Expertise`}
      subtitle={`${companiesWithExtraData.length} ${companiesWithExtraData.length === 1 ? 'company' : 'companies'} found`}
      companies={companiesWithExtraData}
      emptyStateMessage={`No companies found with ${areaName} expertise.`}
    />
  );
}
