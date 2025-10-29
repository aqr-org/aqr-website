"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import CompanyUpdateForm from "@/components/member-settings/CompanyUpdateForm";
import MemberUpdateForm from "@/components/member-settings/MemberUpdateForm";
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import Select from 'react-select';

interface Company {
  id: string;
  name: string;
}

interface Member {
  id: string;
  firstname: string;
  lastname: string;
  email: string;
}

export default function SuperadminPanel() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [companyData, setCompanyData] = useState<any>(null);
  const [companyAreas, setCompanyAreas] = useState<any[]>([]);
  const [companyContactInfo, setCompanyContactInfo] = useState<any | null>(null);
  const [memberData, setMemberData] = useState<any>(null);
  const [isLoadingCompanies, setIsLoadingCompanies] = useState(true);
  const [isLoadingMembers, setIsLoadingMembers] = useState(true);
  const [isLoadingCompanyData, setIsLoadingCompanyData] = useState(false);
  const [isLoadingMemberData, setIsLoadingMemberData] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Ensure component is mounted (client-side only) before rendering Select components
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Fetch all companies
  useEffect(() => {
    const fetchCompanies = async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('companies')
        .select('id, name')
        .order('name');

      if (error) {
        console.error('Error fetching companies:', error);
      } else {
        setCompanies(data || []);
      }
      setIsLoadingCompanies(false);
    };

    fetchCompanies();
  }, []);

  // Fetch all members
  useEffect(() => {
    const fetchMembers = async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('members')
        .select('id, firstname, lastname, email')
        .order('firstname, lastname');

      if (error) {
        console.error('Error fetching members:', error);
      } else {
        setMembers(data || []);
      }
      setIsLoadingMembers(false);
    };

    fetchMembers();
  }, []);

  // Fetch company data when selected
  useEffect(() => {
    const fetchCompanyData = async () => {
      if (!selectedCompanyId) {
        setCompanyData(null);
        setCompanyAreas([]);
        setCompanyContactInfo(null);
        return;
      }

      setIsLoadingCompanyData(true);
      const supabase = createClient();

      try {
        const { data: companyWithRelations, error } = await supabase
          .from("companies")
          .select(`
            *,
            company_areas(id, company_id, area),
            company_contact_info(*)
          `)
          .eq("id", selectedCompanyId)
          .maybeSingle();

        if (error) {
          console.error("Error fetching company data:", error);
          setCompanyData(null);
          setCompanyAreas([]);
          setCompanyContactInfo(null);
        } else {
          setCompanyData(companyWithRelations);
          setCompanyAreas(companyWithRelations?.company_areas || []);
          setCompanyContactInfo(companyWithRelations?.company_contact_info || null);
        }
      } catch (error) {
        console.error("Unexpected error fetching company data:", error);
        setCompanyData(null);
        setCompanyAreas([]);
        setCompanyContactInfo(null);
      }

      setIsLoadingCompanyData(false);
    };

    fetchCompanyData();
  }, [selectedCompanyId]);

  // Fetch member data when selected
  useEffect(() => {
    const fetchMemberData = async () => {
      if (!selectedMemberId) {
        setMemberData(null);
        return;
      }

      setIsLoadingMemberData(true);
      const supabase = createClient();

      try {
        const { data, error } = await supabase
          .from("members")
          .select("*")
          .eq("id", selectedMemberId)
          .maybeSingle();

        if (error) {
          console.error("Error fetching member data:", error);
          setMemberData(null);
        } else {
          setMemberData(data);
        }
      } catch (error) {
        console.error("Unexpected error fetching member data:", error);
        setMemberData(null);
      }

      setIsLoadingMemberData(false);
    };

    fetchMemberData();
  }, [selectedMemberId]);

  const companyOptions = companies.map(company => ({
    value: company.id,
    label: company.name
  }));

  const memberOptions = members.map(member => ({
    value: member.id,
    label: `${member.firstname} ${member.lastname}${member.email ? ` (${member.email})` : ''}`
  }));

  return (
    <div className="w-full">
      <Tabs>
        <TabList 
          className={`
            flex gap-1 items-end
            mb-0 
          `}
        >
          <Tab
            className="border border-qlack border-b-0 font-[400] bg-qaupe bg-gradient-to-t from-qlack/10 to-30% to-qaupe text-qlack px-4 py-2 pb-1 rounded-t-lg cursor-pointer hover:pb-2 transition-all"
            selectedClassName="!font-[600] relative !pb-2 top-[1px] !from-qaupe !to-qaupe"
          >
            Edit Company
          </Tab>
          <Tab
            className="border border-qlack border-b-0 font-[400] bg-qaupe bg-gradient-to-t from-qlack/10 to-30% to-qaupe text-qlack px-4 py-2 pb-1 rounded-t-lg cursor-pointer hover:pb-2 transition-all"
            selectedClassName="!font-[600] relative !pb-2 top-[1px] !from-qaupe !to-qaupe"
          >
            Edit Member
          </Tab>
        </TabList>

        <TabPanel 
          selectedClassName={` border border-qlack rounded-b-lg rounded-tr-lg p-8 w-full bg-qaupe`}
        >
          <div className="w-full space-y-6">
            <div>
              <label htmlFor="company-select" className="block mb-2">
                <p>Select Company</p>
              </label>
              {isMounted ? (
                <Select
                  unstyled
                  classNames={{
                    control: () => 
                      "bg-qlack/10 rounded-lg text-[16px] md:text-xl disabled:opacity-50 disabled:cursor-not-allowed w-full p-4 px-5 placeholder:text-qlack/30 focus:shadow-lg focus:outline-hidden transition-all",
                    menu: () => 
                      "bg-qaupe border-2 border-qlack/20 rounded-lg text-[16px] md:text-xl disabled:opacity-50 disabled:cursor-not-allowed w-full p-4 px-5 placeholder:text-qlack/30 focus:shadow-lg focus:outline-hidden transition-all",
                    placeholder: () => 
                      "text-qlack/30",
                  }}
                  id="company-select"
                  options={companyOptions}
                  isSearchable={true}
                  isClearable={true}
                  value={companyOptions.find(opt => opt.value === selectedCompanyId) || null}
                  onChange={(option) => setSelectedCompanyId(option ? (option as { value: string; label: string }).value : null)}
                  placeholder="-- Select a company --"
                  isDisabled={isLoadingCompanies}
                  isLoading={isLoadingCompanies}
                />
              ) : (
                <div className="bg-qlack/10 rounded-lg text-[16px] md:text-xl w-full p-4 px-5 text-qlack/30">
                  -- Select a company --
                </div>
              )}
            </div>

            {isLoadingCompanyData && (
              <div className="text-center py-8">
                <p>Loading company data...</p>
              </div>
            )}

            {!isLoadingCompanyData && selectedCompanyId && companyData && (
              <CompanyUpdateForm 
                companyData={companyData}
                companyAreas={companyAreas}
                contactData={companyContactInfo}
                isSuperAdmin={true}
              />
            )}

            {!isLoadingCompanyData && selectedCompanyId && !companyData && (
              <div className="text-center py-8">
                <p className="text-red-600">Company not found or error loading data.</p>
              </div>
            )}

            {!selectedCompanyId && (
              <div className="text-center py-8">
                <p className="text-gray-500">Select a company from the dropdown above to edit.</p>
              </div>
            )}
          </div>
        </TabPanel>

        <TabPanel 
          selectedClassName={` border border-qlack rounded-b-lg rounded-tr-lg p-8 w-full bg-qaupe`}
        >
          <div className="w-full space-y-6">
            <div>
              <label htmlFor="member-select" className="block mb-2">
                <p>Select Member</p>
              </label>
              {isMounted ? (
                <Select
                  unstyled
                  classNames={{
                    control: () => 
                      "bg-qlack/10 rounded-lg text-[16px] md:text-xl disabled:opacity-50 disabled:cursor-not-allowed w-full p-4 px-5 placeholder:text-qlack/30 focus:shadow-lg focus:outline-hidden transition-all",
                    menu: () => 
                      "bg-qaupe border-2 border-qlack/20 rounded-lg text-[16px] md:text-xl disabled:opacity-50 disabled:cursor-not-allowed w-full p-4 px-5 placeholder:text-qlack/30 focus:shadow-lg focus:outline-hidden transition-all",
                    placeholder: () => 
                      "text-qlack/30",
                  }}
                  id="member-select"
                  options={memberOptions}
                  isSearchable={true}
                  isClearable={true}
                  value={memberOptions.find(opt => opt.value === selectedMemberId) || null}
                  onChange={(option) => setSelectedMemberId(option ? (option as { value: string; label: string }).value : null)}
                  placeholder="-- Select a member --"
                  isDisabled={isLoadingMembers}
                  isLoading={isLoadingMembers}
                />
              ) : (
                <div className="bg-qlack/10 rounded-lg text-[16px] md:text-xl w-full p-4 px-5 text-qlack/30">
                  -- Select a member --
                </div>
              )}
            </div>

            {isLoadingMemberData && (
              <div className="text-center py-8">
                <p>Loading member data...</p>
              </div>
            )}

            {!isLoadingMemberData && selectedMemberId && memberData && (
              <MemberUpdateForm 
                memberData={memberData}
                isSuperAdmin={true}
              />
            )}

            {!isLoadingMemberData && selectedMemberId && !memberData && (
              <div className="text-center py-8">
                <p className="text-red-600">Member not found or error loading data.</p>
              </div>
            )}

            {!selectedMemberId && (
              <div className="text-center py-8">
                <p className="text-gray-500">Select a member from the dropdown above to edit.</p>
              </div>
            )}
          </div>
        </TabPanel>
      </Tabs>
    </div>
  );
}

