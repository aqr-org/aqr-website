"use client";

import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Check } from "lucide-react";

interface UserBeaconData {
  id: string;
  email: string;
  hasCurrentMembership: boolean;
  hasOrg: boolean;
  organizations: { id: string; name: string }[];
}

interface CompanyCreateFormProps {
  data: UserBeaconData;
}

const companyTypeValues = [
  "Market Research Agency",
  "Recruitment Agency",
  "Field Agency",
  "Viewing Facility",
  "Qualitative Research Agency",
  "Supplier of Services",
  "Freelance Qualitative Research Consultant"
];

const companySizeValues = [
  "Unspecified",
  "Sole operator",
  "1-10",
  "2-5",
  "6-10",
  "11-20",
  "21-30",
  "31-50",
  "51-100",
];

export default function CompanyCreateForm({ data }: CompanyCreateFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [wasCreated, setWasCreated] = useState(false);
  
  // Prefill company name from data.organizations[0].name
  const [formValues, setFormValues] = useState({
    companyName: data?.organizations?.[0]?.name || '',
    type: companyTypeValues[0],
    companysize: companySizeValues[0],
    established: new Date().getFullYear(),
    gradprog: "No",
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Basic validation
    if (!formValues.companyName || !formValues.type || !formValues.companysize || !formValues.established) {
      console.error("All required fields must be filled.");
      alert("Please fill in all required fields.");
      setIsLoading(false);
      return;
    }

    const supabase = createClient();

    try {
      const newCompanyData = {
        name: formValues.companyName.trim(),
        type: formValues.type,
        companysize: formValues.companysize,
        established: formValues.established,
        gradprog: formValues.gradprog,
        narrative: '',
        proforgs: null,
        prsaward: null,
        accred: null,
        beacon_membership_id: data.organizations[0].id,
        beacon_membership_status: data.hasCurrentMembership ? 'Active' : null,
      };
      
      console.log('Creating new company with data:', newCompanyData);
      
      const { data: insertedData, error } = await supabase
        .from("companies")
        .insert(newCompanyData)
        .select()
        .single();

      if (error) {
        console.error("Error creating company:", error);
        alert(`Failed to create company: ${error.message}`);
      } else {
        console.log("Company created successfully:", insertedData);
        setWasCreated(true);
        
        // Refresh the page to show the new company data
        setTimeout(() => {
          router.refresh();
        }, 1000);
      }

    } catch (error) {
      console.error("Unexpected error during company creation:", error);
      alert("An unexpected error occurred. Please try again.");
    }
    
    setIsLoading(false);
  };

  return (
    <div className="w-full border rounded-lg p-6 bg-gray-50">
      <h3 className="text-lg font-semibold mb-4">Create Company Profile</h3>
      <p className="text-sm text-gray-600 mb-4">
        No company profile found. Create one to manage your organization&apos;s information.
      </p>
      
      <form onSubmit={handleSubmit} className="form flex flex-col gap-4">
        
        <label htmlFor="companyName">
          <p className="font-medium mb-1">Company Name <span className="text-red-500">*</span></p>
          <input
            type="text"
            name="companyName"
            id="companyName"
            value={formValues.companyName}
            onChange={(e) => setFormValues(prev => ({ ...prev, companyName: e.target.value }))}
            required
            className="w-full"
          />
        </label>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label htmlFor="type">
            <p className="font-medium mb-1">Company Type <span className="text-red-500">*</span></p>
            <select 
              name="type" 
              id="type" 
              value={formValues.type}
              onChange={(e) => setFormValues(prev => ({ ...prev, type: e.target.value }))}
              required
              className="w-full"
            >
              {companyTypeValues.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </label>
          
          <label htmlFor="companysize">
            <p className="font-medium mb-1">Company Size <span className="text-red-500">*</span></p>
            <select 
              name="companysize" 
              id="companysize" 
              value={formValues.companysize}
              onChange={(e) => setFormValues(prev => ({ ...prev, companysize: e.target.value }))}
              required
              className="w-full"
            >
              {companySizeValues.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label htmlFor="established">
            <p className="font-medium mb-1">Year Established <span className="text-red-500">*</span></p>
            <input
              type="number"
              name="established"
              id="established"
              min="1900"
              max={new Date().getFullYear()}
              step="1"
              value={formValues.established}
              onChange={(e) => setFormValues(prev => ({ ...prev, established: parseInt(e.target.value) || new Date().getFullYear() }))}
              required
              className="w-full"
            />
          </label>

          <label htmlFor="gradprog">
            <p className="font-medium mb-1">Graduate Programme <span className="text-red-500">*</span></p>
            <select 
              name="gradprog" 
              id="gradprog" 
              value={formValues.gradprog}
              onChange={(e) => setFormValues(prev => ({ ...prev, gradprog: e.target.value }))}
              required
              className="w-full"
            >
              <option value="Yes">Yes</option>
              <option value="No">No</option>
            </select>
          </label>
        </div>
        
        <div className="flex justify-end mt-4">
          <div className="flex items-center gap-2">
            {wasCreated && (
              <span className="text-green-600 flex items-center gap-1">
                <Check size="24" />
                <span className="text-sm">Company created!</span>
              </span>
            )}
            <Button type="submit" disabled={isLoading || wasCreated}>
              {isLoading ? "Creating..." : wasCreated ? "Created" : "Create Company Profile"}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}