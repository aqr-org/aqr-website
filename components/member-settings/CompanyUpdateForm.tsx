import CompanyInfoUpdateForm from "./CompanyInfoUpdateForm";
import CompanyAreaUpdateForm from "./CompanyAreaUpdateForm";
import CompanyContactUpdateForm from "./CompanyContactUpdateForm";
import { CompanyData, CompanyAreaData, CompanyContactData } from "../../lib/types";

export default function CompanyUpdateForm({ companyData, companyAreas, contactData, isSuperAdmin = false }: { companyData: CompanyData; companyAreas: CompanyAreaData[]; contactData: CompanyContactData | null; isSuperAdmin?: boolean }) {  
  return(
    <>
        <CompanyInfoUpdateForm companyData={companyData} isSuperAdmin={isSuperAdmin} />
        <CompanyAreaUpdateForm companyId={companyData.id} companyAreas={companyAreas} />
        <CompanyContactUpdateForm companyId={companyData.id} contactData={contactData} />
    </>
  )
} 