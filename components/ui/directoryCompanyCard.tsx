import Link from "next/link";

interface DirectoryCompanyCardProps {
  company: {
    id: string;
    name: string;
    type: string;
    slug: string;
    logo: {
      publicUrl: string;
    };
  }
}

export default function DirectoryCompanyCard(props: DirectoryCompanyCardProps) {
  const { company } = props;

  return (
    <Link 
      key={company.id} 
      href={`/dir/companies/${company.slug}`} 
      className="flex flex-col justify-between items-center gap-4 mb-0 outline outline-qlack rounded-lg px-2.5 py-5 bg-white text-center hover:outline-[3px] hover:outline-qreen-dark hover:text-qreen-dark transition-all"
    >
      <div className="aspect-[19/8] overflow-hidden w- px-3 h-auto relative flex justify-center items-center">
        { company.logo && company.logo.publicUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={company.logo.publicUrl}
              alt={company.name}
              className="w-full h-full object-contain"
            />
        )}
      </div>
      
      <div className="min-h-24 flex flex-col justify-center">
        <h3 className="text-lg">{company.name}</h3>
        <h4 className="text-xs">{company.type}</h4>
      </div>
      
    </Link>
  )
}