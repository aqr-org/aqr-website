"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Check } from "lucide-react";
import MemberFormFields, { type MemberFormData } from "./MemberFormFields";


interface MemberData {
  id: string;
  firstname: string;
  lastname: string;
  email: string;
  jobtitle: string;
  organisation: string;
  country: string;
  biognotes: string;
  joined: string;
  slug: string;
  maintag: string;
  timeline: string[];
}

interface MemberUpdateFormProps {
  memberData: MemberData | null;
}

export default function MemberUpdateForm({ memberData }: MemberUpdateFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [wasUpdated, setWasUpdated] = useState(false);
  
  // Controlled state for form values
  const [formValues, setFormValues] = useState<MemberFormData>({
    firstname: memberData?.firstname || '',
    lastname: memberData?.lastname || '',
    jobtitle: memberData?.jobtitle || '',
    organisation: memberData?.organisation || '',
    country: memberData?.country || '',
    maintag: memberData?.maintag || '',
    joined: memberData?.joined || '',
    timeline: memberData?.timeline || [],
    othertags: [],
    linkedin: '',
    flags: [],
    cttetitle: '',
    ctteareas: '',
    biognotes: memberData?.biognotes || ''
  });

  const handleSubmit = async (biognotes: string) => {
    setIsLoading(true);
    
    console.log('Member form submission started');
    console.log('Current form values:', formValues);
    
    // Basic validation
    if (!memberData?.id || !formValues.firstname || !formValues.lastname || !formValues.jobtitle || !formValues.organisation || !formValues.country) {
      console.error("Required fields are missing.");
      console.error("Missing fields:", {
        id: memberData?.id,
        firstname: formValues.firstname,
        lastname: formValues.lastname,
        jobtitle: formValues.jobtitle,
        organisation: formValues.organisation,
        country: formValues.country,
      });
      alert("Please fill in all required fields (First Name, Last Name, Job Title, Organisation, Country)");
      setIsLoading(false);
      return;
    }

    const supabase = createClient();

    try {
      const updateData = {
        firstname: formValues.firstname.trim(),
        lastname: formValues.lastname.trim(),
        jobtitle: formValues.jobtitle.trim(),
        organisation: formValues.organisation.trim(),
        country: formValues.country.trim(),
        joined: formValues.joined.trim(),
        biognotes: biognotes,
        maintag: formValues.maintag?.trim() || null,
        timeline: formValues.timeline
      };
      
      console.log('Updating member with data:', updateData);
      console.log('Member ID:', memberData.id);
      
      // Update member data using state values
      const { data, error } = await supabase
        .from("members")
        .update(updateData)
        .eq("id", memberData.id);

      if (error) {
        console.error("Error updating member data:", error);
        console.error("Error details:", {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        alert(`Failed to update member data: ${error.message}`);
      } else {
        console.log("Member data updated successfully:", data);
        setWasUpdated(true);
        router.refresh();
      }

    } catch (error) {
      console.error("Unexpected error during member update:", error);
    }
    
    setIsLoading(false);
  };

  const handlePortraitUploaded = (url: string) => {
    // Portrait is stored by UUID, no need to update form state
    console.log('Portrait uploaded:', url);
  };

  if (!memberData) {
    return null;
  }

  return (
    <MemberFormFields
      formValues={formValues}
      onFormChange={setFormValues}
      onSubmit={handleSubmit}
      initialBio={memberData.biognotes}
      submitButtonText={isLoading ? "Updating..." : "Update member data"}
      isLoading={isLoading}
      wasSuccessful={wasUpdated}
      successIcon={<Check size="32" />}
      isCreateMode={false}
      memberId={memberData.id}
      currentPortrait={undefined}
      onPortraitUploaded={handlePortraitUploaded}
    />
  );
}