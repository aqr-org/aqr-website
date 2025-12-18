'use client';

import CompanyUpdateForm from "@/components/member-settings/CompanyUpdateForm";
import MemberUpdateForm from "@/components/member-settings/MemberUpdateForm";
import MemberCreateForm from "@/components/member-settings/MemberCreateForm";
import CompanyCreateForm from "@/components/member-settings/CompanyCreateForm";
import { UserBeaconData } from "@/lib/types";
import { useState, useEffect } from 'react';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';

export default function ProtectedTabs({
  companies,
  membersInfo,
  userEmail,
  userBeaconData
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  companies: Array<{
    admin: null;
    data: any;
    areas: any;
    contactInfo: any;
    logo: string | null;
    organizationId: string;
    organizationName: string;
  }>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  membersInfo: any;
  userEmail: string;
  userBeaconData: UserBeaconData;
}) {

  const [isMounted, setIsMounted] = useState(false);
  const [selectedCompanyIndex, setSelectedCompanyIndex] = useState(0);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Reset selected index if it's out of bounds (e.g., if companies array changes)
  useEffect(() => {
    if (companies.length > 0 && selectedCompanyIndex >= companies.length) {
      setSelectedCompanyIndex(0);
    }
  }, [companies.length, selectedCompanyIndex]);

  const hasDirectoryMembership = (userBeaconData.allMemberships && userBeaconData.allMemberships.some(membership => membership.includes('Business Directory')));
  const isOnlyDirectoryMember = (
    userBeaconData.allMemberships 
    && userBeaconData.allMemberships.length === 1
    && userBeaconData.allMemberships.some(membership => membership.includes('Business Directory')) 
  );

  // Only render tabs after client-side mount to avoid hydration mismatches
  // react-tabs generates random IDs which don't match between server and client
  if (!isMounted) {
    return <div className="p-8">Loading...</div>;
  }

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
            className="border border-qlack/20 border-b-0 font-normal bg-qlack/5 text-qreen-dark px-4 py-2 pb-1 rounded-t-lg cursor-pointer hover:pb-2 transition-all"
            selectedClassName="text-qlack! !font-[600] relative !pb-2 top-[1px] !from-qaupe !to-qaupe bg-qaupe!"
          >
            Edit your personal info
          </Tab> 
        }
        {hasDirectoryMembership && 
          <Tab
            className="border border-qlack/20 border-b-0 font-normal bg-qlack/5 text-qreen-dark px-4 py-2 pb-1 rounded-t-lg cursor-pointer hover:pb-2 transition-all"
            selectedClassName="text-qlack! !font-[600] relative !pb-2 top-[1px] !from-qaupe !to-qaupe bg-qaupe!"
          >
            Edit your organisation info
          </Tab>
        }
      </TabList>

      {!isOnlyDirectoryMember &&
        <TabPanel 
          selectedClassName={` border border-qlack/20 md:rounded-b-lg md:rounded-tr-lg p-8 w-full bg-qaupe`}
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
          selectedClassName={` border border-qlack/20 md:rounded-b-lg md:rounded-tr-lg p-8 w-full bg-qaupe`}
        >
          <div id="company-admin">
            { companies.length === 0 &&
              <CompanyCreateForm {...userBeaconData} />
            }
            { companies.length > 0 && (
              <div className="w-full space-y-6">
                {/* Company selector dropdown - show if multiple organizations */}
                { companies.length > 1 && (
                  <div className="mb-6">
                    <label htmlFor="company-selector" className="block text-sm font-medium text-qlack mb-2">
                      Select Company to Edit:
                    </label>
                    <select
                      id="company-selector"
                      value={selectedCompanyIndex}
                      onChange={(e) => {
                        const newIndex = Number(e.target.value);
                        setSelectedCompanyIndex(newIndex);
                      }}
                      className="w-full px-4 py-2 border border-qlack/20 rounded-lg bg-white text-qlack focus:outline-none focus:ring-2 focus:ring-qreen focus:border-transparent"
                    >
                      {companies.map((company, index) => (
                        <option key={index} value={index}>
                          {company.organizationName || company.data?.name || `Company ${index + 1}`}
                          {!company.data && ' (Not created yet)'}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Render form for selected company - show create form if data is null, update form if data exists */}
                { companies[selectedCompanyIndex] && (
                  <div key={`company-form-${companies[selectedCompanyIndex].organizationId}`}>
                    { !companies[selectedCompanyIndex].data ? (
                      // Company doesn't exist in Supabase yet - show create form
                      <CompanyCreateForm 
                        {...userBeaconData}
                        {...({
                          organizationId: companies[selectedCompanyIndex].organizationId,
                          organizationName: companies[selectedCompanyIndex].organizationName,
                        } as any)}
                      />
                    ) : (
                      // Company exists in Supabase - show update form
                      <CompanyUpdateForm 
                        companyData={companies[selectedCompanyIndex].data}
                        companyAreas={companies[selectedCompanyIndex].areas && Array.isArray(companies[selectedCompanyIndex].areas) ? companies[selectedCompanyIndex].areas : []}
                        contactData={companies[selectedCompanyIndex].contactInfo || null}
                        userBeaconData={userBeaconData}
                      />
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </TabPanel>
      }
      
    </Tabs>
  )
}
