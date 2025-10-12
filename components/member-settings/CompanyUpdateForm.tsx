import CompanyInfoUpdateForm from "./CompanyInfoUpdateForm";
import CompanyAreaUpdateForm from "./CompanyAreaUpdateForm";
import CompanyContactUpdateForm from "./CompanyContactUpdateForm";
import { CompanyData, CompanyAreaData, CompanyContactData } from "../../lib/types";

export default function CompanyUpdateForm({ companyData, companyAreas, contactData }: { companyData: CompanyData; companyAreas: CompanyAreaData[]; contactData: CompanyContactData | null }) {  
  return(
    <>
        <CompanyInfoUpdateForm companyData={companyData} />
        <CompanyAreaUpdateForm companyId={companyData.id} companyAreas={companyAreas} />
        <CompanyContactUpdateForm companyId={companyData.id} contactData={contactData} />
    </>
  )
} 