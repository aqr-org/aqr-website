import Company from '@/components/Company'
import { Metadata, ResolvingMetadata } from 'next'
import { getCompanyData } from '@/lib/company-data'
import { generatePageMetadata } from '@/lib/metadata';
import { notFound } from 'next/navigation';

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
   
    const autoTitle = `${companyName}, ${companyData?.type} ${companyData?.contact_info?.country ? `, ${companyData?.contact_info?.country}` : ''}`;
    const autoDescription = companyData?.narrative ? companyData.narrative.slice(0, 144) + '...' : 'Company information page';
    const logoImage = companyData?.logo?.data?.publicUrl ? { filename: companyData.logo.data.publicUrl } : undefined;

    return await generatePageMetadata(
      {
        meta_title: autoTitle,
        meta_description: autoDescription,
        og_image: logoImage
      },
      parent
    );
  } catch (error) {
    console.error("Error in generateMetadata:", error);
    // Return fallback metadata using the utility
    return await generatePageMetadata({}, parent);
  }
}

export default async function CompaniesPage({
  params
}: {
  params: Promise<{ slug: string }>
}) {
  try {
    const { slug } = await params

    // console.log("CompaniesPage - slug:", slug, "type:", typeof slug);
    // Use the cached function - this will reuse the data from generateMetadata
    const companyData = await getCompanyData(slug);

    // If no company found, show 404
    if (!companyData) {
      notFound();
    }

    return (
      <div className="animate-fade-in">
          <Company data={companyData} />
      </div>
    )
  } catch (error) {
    console.error("Error in CompaniesPage:", error);
    notFound();
  }
}