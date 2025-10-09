'use client';

import CompanyUpdateForm from "@/components/member-settings/CompanyUpdateForm";
import MemberUpdateForm from "@/components/member-settings/MemberUpdateForm";
import MemberCreateForm from "@/components/member-settings/MemberCreateForm";
import CompanyCreateForm from "@/components/member-settings/CompanyCreateForm";
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
// import 'react-tabs/style/react-tabs.css';
import { UserBeaconData } from "@/lib/types";

export default function ProtectedTabs({
  companyData,
  companyAreas,
  companyContactInfo,
  membersInfo,
  userEmail,
  userBeaconData
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  companyData: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  companyAreas: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  companyContactInfo: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  membersInfo: any;
  userEmail: string;
  userBeaconData: UserBeaconData;
}) {

  const hasDirectoryMembership = (userBeaconData.allMemberships && userBeaconData.allMemberships.includes('Business Directory')) || (userBeaconData.allMemberships && userBeaconData.allMemberships.includes('Business Directory'));
  const isOnlyDirectoryMember = (
    userBeaconData.allMemberships 
    && userBeaconData.allMemberships.length === 1
    && userBeaconData.allMemberships[0] === 'Business Directory' 
  );

  return(
    <Tabs>
        <TabList 
          className={`
            flex gap-1
            mb-4
            *:bg-qreen text-qaupe *:px-4 *:py-2 *:rounded-full
            *:[aria-selected=true]:bg-qaupe *:[aria-selected=true]:text-qreen
          `}
        >
          {!isOnlyDirectoryMember && <Tab>Edit your personal info</Tab> }
          {hasDirectoryMembership && <Tab>Edit your organisation info</Tab> }
        </TabList>

        {!isOnlyDirectoryMember &&
          <TabPanel>
            <div id="member-admin" className="flex flex-col gap-2 items-start">
              
              {membersInfo.data && membersInfo.data.length !== 0 && (
                <div className="w-full space-y-6">
                  <MemberUpdateForm 
                    memberData={membersInfo.data ? membersInfo.data[0] : null}
                  />
                </div>
              )}
              
              {(!membersInfo.data || membersInfo.data.length === 0) && (
                <MemberCreateForm userEmail={userEmail} />
              )}
            </div>
          </TabPanel>  
        }

        {hasDirectoryMembership &&
          <TabPanel>
            <div id="company-admin" className="flex flex-col gap-2 items-start">
              { !companyData &&
                <CompanyCreateForm data={userBeaconData} />
              }
                <div className="w-full space-y-6">

                  { companyData &&
                    <CompanyUpdateForm 
                      companyData={companyData ? companyData : null}
                      companyAreas={companyAreas ? companyAreas.data : []}
                      contactData={companyContactInfo || null}
                    />
                  }

                </div>
            </div>
          </TabPanel>
        }
        
      </Tabs>
      
  )
}
