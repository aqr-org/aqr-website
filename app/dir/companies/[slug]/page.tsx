import Company from '@/components/Company'
import { Metadata, ResolvingMetadata } from 'next'
import { getCompanyData } from '@/lib/company-data'
import { Suspense } from 'react'
import { LoadingAnimation } from '@/components/ui/loading-animation'

type Props = {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  try {
    // read route params
    const theseParams = await params;
    const { slug } = theseParams;
    const [ companyData] = await Promise.all([
      getCompanyData(slug)
    ]);
    const companyName = companyData?.name || 'Company';
   
    // optionally access and extend (rather than replace) parent metadata
    const previousImages = (await parent).openGraph?.images || []

    const autoTitle = `${companyName}, ${companyData?.type} ${companyData?.contact_info?.country ? `, ${companyData?.contact_info?.country}` : ''}`;
    

    return {
      title: autoTitle,
      description: companyData?.narrative.slice(0, 144) + '...',
      openGraph: {
        images: companyData?.logo?.data?.publicUrl ? [companyData.logo.data.publicUrl, ...previousImages] : [...previousImages],
      },
    }
  } catch (error) {
    console.error("Error in generateMetadata:", error);
    // Return fallback metadata
    return {
      title: "Company Page",
      description: "Company information page",
    }
  }
}

export default async function CompaniesPage({
  params
}: {
  params: Promise<{ slug: string }>
}) {
  try {
    const { slug } = await params

    console.log("CompaniesPage - slug:", slug, "type:", typeof slug);
    // Use the cached function - this will reuse the data from generateMetadata
    const companyData = await getCompanyData(slug);

    // If no company found, return early
    if (!companyData) {
      return (
        <Suspense fallback={<LoadingAnimation text="Loading company..." />}>
          <div>
            <h1>Company Detail Page for slug: {slug}</h1>
            <div className="mb-4">
              <p className="text-red-500">Company not found</p>
            </div>
          </div>
        </Suspense>
      )
    }

    return (
      <>
          <Company data={companyData} />
      </>
    )
  } catch (error) {
    console.error("Error in CompaniesPage:", error);
    return (
      <div>
        <h1>Error Loading Company</h1>
        <div className="mb-4">
          <p className="text-red-500">An error occurred while loading the company data.</p>
        </div>
      </div>
    )
  }
}