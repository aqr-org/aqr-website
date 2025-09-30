'use client';

import CompanyUpdateForm from "@/components/CompanyUpdateForm";
import CompanyAreaUpdateForm from "@/components/CompanyAreaUpdateForm";
import CompanyContactUpdateForm from "@/components/CompanyContactUpdateForm";
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import 'react-tabs/style/react-tabs.css';

export default function ProtectedTabs({
  companiesAdminInfo,
  companyData,
  companyAreas,
  companyContactInfo,
  membersInfo
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  companiesAdminInfo: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  companyData: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  companyAreas: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  companyContactInfo: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  membersInfo: any;
}) {
  return(
    <Tabs>
        <TabList>
          <Tab>Company Admin</Tab>
          <Tab>Member Info</Tab>
        </TabList>
        <TabPanel>
          <div id="company-admin" className="flex flex-col gap-2 items-start">
            <h2 className="font-bold text-2xl mb-4">Your company admin details</h2>

            {companiesAdminInfo.data && companiesAdminInfo.data.length !== 0 && (
              <div className="w-full space-y-6">
                <CompanyUpdateForm 
                  companyData={companyData.data ? companyData.data[0] : null}
                />
                
                <CompanyAreaUpdateForm 
                  companyId={companiesAdminInfo.data[0].company_id}
                  companyAreas={companyAreas.data ? companyAreas.data : []}
                />

                <CompanyContactUpdateForm 
                  companyId={companiesAdminInfo.data[0].company_id}
                  contactData={companyContactInfo.data || null}
                />

              </div>
            )}     
          </div>
        </TabPanel>
        <TabPanel>
          <div id="member-admin" className="flex flex-col gap-2 items-start">
            <h2 className="font-bold text-2xl mb-4">Your member details</h2>
            <pre className="text-xs font-mono p-3 rounded border max-h-32 overflow-auto">
              {JSON.stringify(membersInfo.data, null, 2)}
            </pre>
          </div>
        </TabPanel>  
      </Tabs>
      
  )
}