"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import CompanyUpdateForm from "@/components/member-settings/CompanyUpdateForm";
import Select from 'react-select';
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";
import { UserBeaconData } from "@/lib/types";

interface Company {
  id: string;
  name: string;
}

// Helper function to extract membership tier from allMemberships
function getMembershipTier(allMemberships?: string[]): string | null {
  if (!allMemberships || allMemberships.length === 0) {
    return null;
  }

  if (allMemberships.some(m => m.includes("Business Directory Enhanced"))) {
    return "Enhanced";
  } else if (allMemberships.some(m => m.includes("Business Directory Standard"))) {
    return "Standard";
  } else if (allMemberships.some(m => m.includes("Business Directory Basic"))) {
    return "Basic";
  }

  return null;
}

interface EditCompanyTabProps {
  isMounted: boolean;
  onDeleteCompany: (companyId: string) => void;
}

export default function EditCompanyTab({ isMounted, onDeleteCompany }: EditCompanyTabProps) {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const [companyData, setCompanyData] = useState<any>(null);
  const [companyAreas, setCompanyAreas] = useState<any[]>([]);
  const [companyContactInfo, setCompanyContactInfo] = useState<any | null>(null);
  const [companyBeaconData, setCompanyBeaconData] = useState<UserBeaconData | null>(null);
  const [isLoadingCompanies, setIsLoadingCompanies] = useState(true);
  const [isLoadingCompanyData, setIsLoadingCompanyData] = useState(false);

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

  // Fetch company data when selected
  useEffect(() => {
    const fetchCompanyData = async () => {
      if (!selectedCompanyId) {
        setCompanyData(null);
        setCompanyAreas([]);
        setCompanyContactInfo(null);
        setCompanyBeaconData(null);
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
          setCompanyBeaconData(null);
        } else {
          setCompanyData(companyWithRelations);
          setCompanyAreas(companyWithRelations?.company_areas || []);
          setCompanyContactInfo(companyWithRelations?.company_contact_info || null);
          
          // Fetch beacon data for the company by beacon_membership_id or organization name
          if (companyWithRelations?.name || companyWithRelations?.beacon_membership_id) {
            try {
              const response = await fetch('/api/beacon/company-membership', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                  companyName: companyWithRelations.name,
                  beaconMembershipId: companyWithRelations.beacon_membership_id
                }),
              }).catch((fetchError) => {
                console.error("Fetch error (network/CORS):", fetchError);
                throw fetchError;
              });
              
              if (response.ok) {
                const membershipData = await response.json();
                
                if (membershipData.found && membershipData.allMemberships && membershipData.allMemberships.length > 0) {
                  // Create a UserBeaconData-like object with just the membership info
                  const finalBeaconData: UserBeaconData = {
                    allMemberships: membershipData.allMemberships,
                    // Add minimal required fields
                    id: '',
                    personId: '',
                    firstname: '',
                    lastname: '',
                    email: '',
                    hasCurrentMembership: true,
                    hasOrg: true,
                    organizations: [{ id: '', name: companyWithRelations.name }]
                  };
                  
                  setCompanyBeaconData(finalBeaconData);
                } else {
                  setCompanyBeaconData(null);
                }
              } else {
                const errorText = await response.text().catch(() => 'Could not read error response');
                console.error("Failed to fetch company membership, status:", response.status, "Error:", errorText);
                setCompanyBeaconData(null);
              }
            } catch (error) {
              console.error("Error fetching company membership:", error);
              setCompanyBeaconData(null);
            }
          } else {
            setCompanyBeaconData(null);
          }
        }
      } catch (error) {
        console.error("Unexpected error fetching company data:", error);
        setCompanyData(null);
        setCompanyAreas([]);
        setCompanyContactInfo(null);
        setCompanyBeaconData(null);
      }

      setIsLoadingCompanyData(false);
    };

    fetchCompanyData();
  }, [selectedCompanyId]);

  const companyOptions = companies.map(company => ({
    value: company.id,
    label: company.name
  }));

  return (
    <div className="w-full space-y-6">
      <div>
        <label htmlFor="company-select" className="block mb-2">
          <p>Select Company</p>
        </label>
        {isMounted ? (
          <Select
            unstyled
            instanceId="company-select"
            classNames={{
              control: () => 
                "bg-white/80 border border-qreen/30 rounded-lg text-base text-qreen-dark md:text-xl disabled:opacity-50 disabled:cursor-not-allowed w-full p-4 px-5 placeholder:text-qlack/30 focus:shadow-lg focus:outline-hidden transition-all",
              menu: () => 
                "bg-white  border border-qreen/30 rounded-lg text-base text-qreen-dark md:text-xl disabled:opacity-50 disabled:cursor-not-allowed w-full p-4 px-5 placeholder:text-qlack/30 focus:shadow-lg focus:outline-hidden transition-all",
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
        <>
          {/* Display company name, membership tier, and status */}
          <div className="mb-6">
            <h2 className="text-2xl md:text-3xl font-semibold text-qreen-dark mb-2">
              {companyData.name}
            </h2>
            {(companyBeaconData || companyData.beacon_membership_status) && (
              <div className="flex gap-4 items-center text-sm text-qlack/70">
                {companyBeaconData && (
                  <>
                    {getMembershipTier(companyBeaconData.allMemberships) && (
                      <span>
                        <strong>Membership Tier:</strong> {getMembershipTier(companyBeaconData.allMemberships)}
                      </span>
                    )}
                  </>
                )}
                {companyData.beacon_membership_status && (
                  <span>
                    <strong>Status:</strong> {companyData.beacon_membership_status}
                  </span>
                )}
              </div>
            )}
          </div>
          <div className="mb-4">
            <Button
              variant="alert"
              onClick={() => selectedCompanyId && onDeleteCompany(selectedCompanyId)}
              className="w-full sm:w-auto bg-qrose text-qaupe text-sm"
            >
              <AlertTriangle className="w-4 h-4" />
              Delete Company
            </Button>
          </div>
          <CompanyUpdateForm 
            companyData={companyData}
            companyAreas={companyAreas}
            contactData={companyContactInfo}
            isSuperAdmin={true}
            userBeaconData={companyBeaconData || undefined}
          />
        </>
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
  );
}
