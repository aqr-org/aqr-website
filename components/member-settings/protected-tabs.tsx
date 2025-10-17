'use client';

import CompanyUpdateForm from "@/components/member-settings/CompanyUpdateForm";
import MemberUpdateForm from "@/components/member-settings/MemberUpdateForm";
import MemberCreateForm from "@/components/member-settings/MemberCreateForm";
import CompanyCreateForm from "@/components/member-settings/CompanyCreateForm";
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import { UserBeaconData } from "@/lib/types";

export default function ProtectedTabs({
  companyData,
  companyAreas,
  companyContactInfo,
  membersInfo,
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
    && userBeaconData.allMemberships[0].includes('Business Directory') 
  );

  return(
    <Tabs>
        <TabList 
          className={`
            flex gap-1 items-end
            mb-0 
          `}
        >
          {!isOnlyDirectoryMember && 
            <Tab
              className="border border-qlack border-b-0 font-[400] bg-qaupe bg-gradient-to-t from-qlack/10 to-30% to-qaupe text-qlack px-4 py-2 pb-1 rounded-t-lg cursor-pointer hover:pb-2 transition-all"
              selectedClassName="!font-[600] relative !pb-2 top-[1px] !from-qaupe !to-qaupe"
            >
              Edit your personal info
            </Tab> 
          }
          {hasDirectoryMembership && 
            <Tab
              className="border border-qlack border-b-0 font-[400] bg-qaupe bg-gradient-to-t from-qlack/10 to-30% to-qaupe text-qlack px-4 py-2 pb-1 rounded-t-lg cursor-pointer hover:pb-2 transition-all"
              selectedClassName="!font-[600] relative !pb-2 top-[1px] !from-qaupe !to-qaupe"
            >
              Edit your organisation info
            </Tab>
          }
        </TabList>

        {!isOnlyDirectoryMember &&
          <TabPanel 
            selectedClassName={` border border-qlack rounded-b-lg rounded-tr-lg p-8 w-full bg-qaupe`}
          >
            <div id="member-admin">
              
              {membersInfo.data && membersInfo.data.length !== 0 && (
                <div className="w-full space-y-6">
                  <MemberUpdateForm 
                    memberData={membersInfo.data ? membersInfo.data[0] : null}
                  />
                </div>
              )}
              
              {(!membersInfo.data || membersInfo.data.length === 0) && (
                <MemberCreateForm userBeaconData={userBeaconData} />
              )}
            </div>
          </TabPanel>  
        }

        {hasDirectoryMembership &&
          <TabPanel 
            selectedClassName={` border border-qlack rounded-b-lg rounded-tr-lg p-8 w-full bg-qaupe`}
          >
            <div id="company-admin">
              { !companyData &&
                <CompanyCreateForm {...userBeaconData} />
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
