import { createClient } from "@/lib/supabase/server";
import { Metadata } from "next";
import DirectoryPageLayout from "@/components/DirectoryPageLayout";
import { fetchCompaniesWithExtraData } from "@/lib/directory-utils";

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

  const supabase = await createClient();
  
  // Fetch companies where type matches the sector name
  const companies = await supabase
    .from('companies')
    .select('*')
    .eq('beacon_membership_status', 'Active')
    .eq('type', sectorName);

  if (companies.error) {
    console.error("Companies error:", companies.error);
  }

  const companyIds = companies.data?.map(company => company.id) || [];
  const companiesWithExtraData = await fetchCompaniesWithExtraData(companyIds);
  
  return (
    <DirectoryPageLayout
      title={`${sectorName} Companies`}
      subtitle={`${companiesWithExtraData.length} ${companiesWithExtraData.length === 1 ? 'company' : 'companies'} found`}
      companies={companiesWithExtraData}
      emptyStateMessage={`No companies found in the ${sectorName} sector.`}
    />
  );
}
