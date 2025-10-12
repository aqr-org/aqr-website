"use client";

import { useState } from "react";
import CompanyInfoUpdateForm from "./CompanyInfoUpdateForm";
import CompanyAreaUpdateForm from "./CompanyAreaUpdateForm";
import CompanyContactUpdateForm from "./CompanyContactUpdateForm";
import { UserBeaconData } from "@/lib/types";

export default function CompanyCreateForm(data: UserBeaconData) {
  const [createdCompanyId, setCreatedCompanyId] = useState<string | null>(null);

  const handleCompanyCreated = (companyId: string) => {
    setCreatedCompanyId(companyId);
    console.log("Company created with ID:", companyId);
  };

  // Create a minimal company data object with prefilled name
  const prefilledCompanyData = {
    name: data?.organizations?.[0]?.name || '',
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
        beaconData={data}
      />
      
      {createdCompanyId && (
        <>
          <CompanyAreaUpdateForm 
            companyId={createdCompanyId}
            companyAreas={[]}
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