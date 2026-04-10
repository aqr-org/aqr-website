"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import CompanyUpdateForm from "@/components/member-settings/CompanyUpdateForm";
import CompanyCreateForm from "@/components/member-settings/CompanyCreateForm";
import Select, { components, GroupBase } from 'react-select';
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";
import { UserBeaconData } from "@/lib/types";

interface Company {
  id: string;
  name: string;
  beacon_id?: string | null;
  beacon_membership_status?: string | null;
}

interface BeaconDirectoryCompany {
  organizationId: string;
  organizationName: string;
  membershipId: string;
  membershipType: string | null;
  membershipStatus: string;
}

type CompanyOption = {
  value: string;
  label: string;
  status: string | null;
  source: "supabase" | "beacon";
};

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
  const [beaconOnlyCompanies, setBeaconOnlyCompanies] = useState<BeaconDirectoryCompany[]>([]);
  const [selectedCompanyValue, setSelectedCompanyValue] = useState<string | null>(null);
  const [companyData, setCompanyData] = useState<any>(null);
  const [companyAreas, setCompanyAreas] = useState<any[]>([]);
  const [companyContactInfo, setCompanyContactInfo] = useState<any | null>(null);
  const [companyBeaconData, setCompanyBeaconData] = useState<UserBeaconData | null>(null);
  const [isLoadingCompanies, setIsLoadingCompanies] = useState(true);
  const [isLoadingCompanyData, setIsLoadingCompanyData] = useState(false);
  const [isUpdatingMembershipStatus, setIsUpdatingMembershipStatus] = useState(false);
  const [manualMembershipStatus, setManualMembershipStatus] = useState<string>("");

  // Fetch all companies
  useEffect(() => {
    const fetchCompanies = async () => {
      const supabase = createClient();
      const { data: supabaseCompanies, error } = await supabase
        .from('companies')
        .select('id, name, beacon_id, beacon_membership_status')
        .order('name');

      if (error) {
        console.error('Error fetching companies:', error);
      } else {
        const sbCompanies = supabaseCompanies || [];
        setCompanies(sbCompanies);

        try {
          const response = await fetch('/api/beacon/active-directory-companies');
          if (response.ok) {
            const payload = await response.json();
            const beaconCompanies: BeaconDirectoryCompany[] = payload?.companies || [];

            const normalizedSbNames = new Set(
              sbCompanies
                .map((company) => company.name?.trim().toLowerCase())
                .filter(Boolean),
            );
            const sbBeaconIds = new Set(
              sbCompanies
                .map((company) => company.beacon_id ? String(company.beacon_id) : null)
                .filter(Boolean),
            );

            const missingInSupabase = beaconCompanies.filter((beaconCompany) => {
              const sameBeaconId = sbBeaconIds.has(String(beaconCompany.organizationId));
              const sameName = normalizedSbNames.has(
                beaconCompany.organizationName.trim().toLowerCase(),
              );
              return !sameBeaconId && !sameName;
            });

            setBeaconOnlyCompanies(missingInSupabase);
          } else {
            setBeaconOnlyCompanies([]);
            console.error('Failed to fetch Beacon-only companies:', response.status);
          }
        } catch (beaconError) {
          setBeaconOnlyCompanies([]);
          console.error('Error fetching Beacon-only companies:', beaconError);
        }
      }
      setIsLoadingCompanies(false);
    };

    fetchCompanies();
  }, []);

  // Fetch company data when selected
  useEffect(() => {
    const selectedSupabaseCompanyId = selectedCompanyValue?.startsWith("sb:")
      ? selectedCompanyValue.slice(3)
      : null;

    const fetchCompanyData = async () => {
      if (!selectedSupabaseCompanyId) {
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
          .eq("id", selectedSupabaseCompanyId)
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
  }, [selectedCompanyValue]);

  useEffect(() => {
    setManualMembershipStatus(companyData?.beacon_membership_status || "");
  }, [companyData?.id, companyData?.beacon_membership_status]);

  const handleMembershipStatusChange = async (nextStatus: string) => {
    if (!selectedSupabaseCompanyId || !companyData) return;

    setIsUpdatingMembershipStatus(true);
    const supabase = createClient();
    const statusToSave = nextStatus.trim() === "" ? null : nextStatus;

    const { error } = await supabase
      .from("companies")
      .update({ beacon_membership_status: statusToSave })
      .eq("id", selectedSupabaseCompanyId);

    if (error) {
      console.error("Error updating company membership status:", error);
      alert(`Failed to update status: ${error.message}`);
      setManualMembershipStatus(companyData?.beacon_membership_status || "");
      setIsUpdatingMembershipStatus(false);
      return;
    }

    setManualMembershipStatus(statusToSave || "");
    setCompanyData((prev: any) => (prev ? { ...prev, beacon_membership_status: statusToSave } : prev));
    setIsUpdatingMembershipStatus(false);
  };

  const supabaseCompanyOptions: CompanyOption[] = companies.map((company) => ({
    value: `sb:${company.id}`,
    label: company.name,
    // Use Supabase value as-is; do not derive from Beacon.
    status: company.beacon_membership_status ?? null,
    source: "supabase",
  }));
  const beaconOnlyCompanyOptions: CompanyOption[] = beaconOnlyCompanies.map((company) => ({
    value: `beacon:${company.organizationId}`,
    label: company.organizationName,
    status: company.membershipStatus || "Unknown",
    source: "beacon",
  }));

  const groupedCompanyOptions: GroupBase<CompanyOption>[] = [
    {
      label: "Existing in Supabase",
      options: supabaseCompanyOptions,
    },
    {
      label: "Beacon Business Directory (create in SB)",
      options: beaconOnlyCompanyOptions,
    },
  ];
  const allCompanyOptions: CompanyOption[] = [
    ...supabaseCompanyOptions,
    ...beaconOnlyCompanyOptions,
  ];

  const getStatusPillClasses = (status?: string | null) => {
    const normalized = (status || "").trim().toLowerCase();
    if (normalized === "active") {
      return "bg-qreen/10 text-qreen border-qreen/30";
    }
    if (normalized === "expired") {
      return "bg-qrose/10 text-qrose border-qrose/30";
    }
    return "bg-qeal/10 text-qeal border-qeal/30";
  };

  const formatOptionLabel = (option: CompanyOption) => (
    <div className={`
      flex items-center gap-1 px-4 py-1 
      ${option.status === "Active" ? "hover:bg-qreen/10" : option.status === "Expired" ? "hover:bg-qrose/10" : "hover:bg-qeal/10"} 
      rounded-lg cursor-pointer
    `}>
      <span className="truncate">{option.label}</span>
      <span
        className={`shrink-0 rounded-full border px-2 py-0.5 text-xs font-semibold ${getStatusPillClasses(option.status)}`}
      >
        {option.status ?? "No status"}
      </span>
    </div>
  );

  const selectedSupabaseCompanyId = selectedCompanyValue?.startsWith("sb:")
    ? selectedCompanyValue.slice(3)
    : null;
  const selectedBeaconOrgId = selectedCompanyValue?.startsWith("beacon:")
    ? selectedCompanyValue.slice(7)
    : null;
  const selectedBeaconCompany = selectedBeaconOrgId
    ? beaconOnlyCompanies.find((company) => company.organizationId === selectedBeaconOrgId) || null
    : null;
  const knownMembershipStatuses = [
    "Active",
    "Expired",
    "Lapsed",
    "Cancelled",
    "Suspended",
    "Pending",
    "Inactive",
  ];
  const availableMembershipStatuses = Array.from(
    new Set(
      [
        ...knownMembershipStatuses,
        companyData?.beacon_membership_status || "",
      ].filter(Boolean),
    ),
  );

  const beaconDataForCreate: UserBeaconData | null = selectedBeaconCompany
    ? {
        id: selectedBeaconCompany.membershipId || "",
        personId: "",
        email: "",
        firstname: "",
        lastname: "",
        hasCurrentMembership: selectedBeaconCompany.membershipStatus === "Active",
        hasOrg: true,
        allMemberships: selectedBeaconCompany.membershipType
          ? [selectedBeaconCompany.membershipType]
          : ["Business Directory"],
        organizations: [
          {
            id: selectedBeaconCompany.organizationId,
            name: selectedBeaconCompany.organizationName,
          },
        ],
        membershipStatus: selectedBeaconCompany.membershipStatus,
      }
    : null;

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
              groupHeading: () =>
                "text-sm md:text-base font-bold text-gray-500 px-1 py-2 uppercase tracking-wide",
            }}
            id="company-select"
            options={groupedCompanyOptions}
            isSearchable={true}
            isClearable={true}
            value={allCompanyOptions.find(opt => opt.value === selectedCompanyValue) || null}
            onChange={(option) => setSelectedCompanyValue(option ? (option as { value: string; label: string }).value : null)}
            formatOptionLabel={formatOptionLabel}
            components={{
              SingleValue: (props) => (
                <components.SingleValue {...props}>
                  {formatOptionLabel(props.data as CompanyOption)}
                </components.SingleValue>
              ),
            }}
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

      {!isLoadingCompanyData && selectedSupabaseCompanyId && companyData && (
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
            <div className="mt-4 max-w-md">
              <label htmlFor="superadmin-membership-status" className="block mb-2 text-sm text-qlack/80">
                Membership status override (test only)
              </label>
              <select
                id="superadmin-membership-status"
                value={manualMembershipStatus}
                disabled={isUpdatingMembershipStatus}
                onChange={(e) => {
                  const next = e.target.value;
                  setManualMembershipStatus(next);
                  void handleMembershipStatusChange(next);
                }}
                className="w-full px-4 py-2 border border-qlack/20 rounded-lg bg-white text-qlack focus:outline-none focus:ring-2 focus:ring-qreen focus:border-transparent disabled:opacity-60"
              >
                <option value="">No status</option>
                {availableMembershipStatuses.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
              <p className="text-xs text-qlack/60 mt-2">
                Beacon remains source of truth. Cron sync may overwrite this value.
              </p>
            </div>
          </div>
          <div className="mb-4">
            <Button
              variant="alert"
              onClick={() => selectedSupabaseCompanyId && onDeleteCompany(selectedSupabaseCompanyId)}
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

      {!isLoadingCompanyData && selectedSupabaseCompanyId && !companyData && (
        <div className="text-center py-8">
          <p className="text-red-600">Company not found or error loading data.</p>
        </div>
      )}

      {selectedBeaconCompany && beaconDataForCreate && (
        <div className="space-y-4">
          <div className="rounded-lg border border-qreen/20 bg-qreen/5 p-4">
            <p className="text-sm text-qlack/80">
              This company is active in Beacon Business Directory but has no Supabase record yet.
              Use the form below to create and complete the company profile.
            </p>
          </div>
          <CompanyCreateForm
            {...beaconDataForCreate}
            organizationId={selectedBeaconCompany.organizationId}
            organizationName={selectedBeaconCompany.organizationName}
          />
        </div>
      )}

      {!selectedCompanyValue && (
        <div className="text-center py-8">
          <p className="text-gray-500">Select a company from the dropdown above to edit.</p>
        </div>
      )}
    </div>
  );
}
