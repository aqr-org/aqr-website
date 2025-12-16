import CompanyInfoUpdateForm from "./CompanyInfoUpdateForm";
import CompanyAreaUpdateForm from "./CompanyAreaUpdateForm";
import CompanyContactUpdateForm from "./CompanyContactUpdateForm";
import { CompanyData, CompanyAreaData, CompanyContactData, UserBeaconData } from "../../lib/types";

export default function CompanyUpdateForm({ companyData, companyAreas, contactData, isSuperAdmin = false, userBeaconData }: { companyData: CompanyData; companyAreas: CompanyAreaData[]; contactData: CompanyContactData | null; isSuperAdmin?: boolean; userBeaconData?: UserBeaconData }) {  
  return(
    <>
        <CompanyInfoUpdateForm companyData={companyData} isSuperAdmin={isSuperAdmin} userBeaconData={userBeaconData} />
        <CompanyAreaUpdateForm companyId={companyData.id} companyAreas={companyAreas} userBeaconData={userBeaconData} isSuperAdmin={isSuperAdmin} />
        <CompanyContactUpdateForm companyId={companyData.id} contactData={contactData} />
    </>
  )
} 