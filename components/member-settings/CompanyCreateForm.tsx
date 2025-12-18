"use client";

import { useState } from "react";
import CompanyInfoUpdateForm from "./CompanyInfoUpdateForm";
import CompanyAreaUpdateForm from "./CompanyAreaUpdateForm";
import CompanyContactUpdateForm from "./CompanyContactUpdateForm";
import { UserBeaconData } from "@/lib/types";

interface CompanyCreateFormProps extends UserBeaconData {
  organizationId?: string;
  organizationName?: string;
}

export default function CompanyCreateForm(data: CompanyCreateFormProps) {
  const [createdCompanyId, setCreatedCompanyId] = useState<string | null>(null);

  const handleCompanyCreated = (companyId: string) => {
    setCreatedCompanyId(companyId);
    console.log("Company created with ID:", companyId);
  };

  // Use the specific organization name if provided, otherwise fall back to first organization
  const organizationName = data.organizationName || data?.organizations?.[0]?.name || '';
  const organizationId = data.organizationId || data?.organizations?.[0]?.id || '';

  // Create a minimal company data object with prefilled name
  const prefilledCompanyData = {
    name: organizationName,
    // Don't set id - this should be null for create mode
    type: '',
    established: 0,
    companysize: '',
    narrative: '',
    gradprog: '',
    proforgs: '',
    prsaward: '',
    accred: '',
    logo: '',
    // Other fields will use their defaults in CompanyInfoUpdateForm
  };

  // Create a modified beaconData with only the specific organization
  const beaconDataForOrganization = {
    ...data,
    organizations: organizationId && organizationName 
      ? [{ id: organizationId, name: organizationName }]
      : data.organizations || [],
  };

  return (
    <div className="w-full space-y-6">
      <div className="border rounded-lg p-6 bg-gray-50">
        <h3 className="text-lg font-semibold mb-4">Create Company Profile</h3>
        <p className="text-sm text-gray-600 mb-4">
          No company profile found. Create one to manage your organization&apos;s information.
        </p>
      </div>
      
      <CompanyInfoUpdateForm 
        companyData={prefilledCompanyData} 
        onSuccess={handleCompanyCreated}
        beaconData={beaconDataForOrganization}
      />
      
      {createdCompanyId && (
        <>
          <CompanyAreaUpdateForm 
            companyId={createdCompanyId}
            companyAreas={[]}
            userBeaconData={data}
          />
          <CompanyContactUpdateForm 
            companyId={createdCompanyId}
            contactData={null}
          />
        </>
      )}
    </div>
  );
}