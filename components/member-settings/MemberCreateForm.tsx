"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Check } from "lucide-react";
import MemberFormFields, { type MemberFormData } from "./MemberFormFields";
import type { MemberCreateFormProps } from '@/lib/types/members';

export default function MemberCreateForm({ userBeaconData }: MemberCreateFormProps) {
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);
  const [wasCreated, setWasCreated] = useState(false);
  const [createdMemberId, setCreatedMemberId] = useState<string | null>(null);
  
  // Controlled state for form values - all empty initially
  const [formValues, setFormValues] = useState<MemberFormData>({
    firstname: userBeaconData.firstname || '',
    lastname: userBeaconData.lastname || '',
    jobtitle: '',
    organisation: '',
    country: '',
    joined: '',
    maintag: '',
    othertags: [],
    linkedin: '',
    flags: [],
    cttetitle: '',
    ctteareas: '',
    biognotes: '',
    timeline: [],
    beacon_id: userBeaconData.personId || '',
    beacon_membership: userBeaconData.id || '',
    beacon_membership_status: userBeaconData.hasCurrentMembership ? 'Active' : ''
  });

  const userEmail = userBeaconData.email;

  const handlePortraitUploaded = (url: string) => {
    // Portrait is stored by UUID, no need to update form state
    console.log('Portrait uploaded:', url);
  };

  const handleSubmit = async (biognotes: string) => {
    setIsCreating(true);
    
    console.log('Creating new member with form data:', formValues);
    console.log('User email:', userEmail);
    
    // Basic validation - firstname and lastname are mandatory
    if (!formValues.firstname.trim() || !formValues.lastname.trim()) {
      console.error("First name and last name are required");
      alert("Please fill in your First Name and Last Name (required fields)");
      setIsCreating(false);
      return;
    }

    const supabase = createClient();

    try {
      const insertData = {
        email: userEmail,
        firstname: formValues.firstname.trim(),
        lastname: formValues.lastname.trim(),
        jobtitle: formValues.jobtitle.trim(),
        organisation: formValues.organisation.trim(),
        country: formValues.country.trim(),
        joined: formValues.joined.trim() || null,
        biognotes: biognotes,
        maintag: formValues.maintag?.trim() || null,
        timeline: formValues.timeline.filter(item => item.trim() !== ''), // Remove empty timeline entries\
        othertags: formValues.othertags.length > 0 ? formValues.othertags.map(tag => tag.trim()).filter(tag => tag !== '') : null,
        linkedin: formValues.linkedin?.trim() || null,
        flags: formValues.flags.length > 0 ? formValues.flags.map(flag => flag.trim()).filter(flag => flag !== '') : null,
        cttetitle: formValues.cttetitle?.trim() || null,
        ctteareas: formValues.ctteareas?.trim() || null,
        beacon_id: formValues.beacon_id || null,
        beacon_membership: formValues.beacon_membership || null,
        beacon_membership_status: formValues.beacon_membership_status || null,
      };

      console.log('Creating member with data:', insertData);

      // Create a new member record with the form data
      const { data, error } = await supabase
        .from("members")
        .insert(insertData)
        .select()
        .single();

      if (error) {
        console.error("Error creating member record:", error);
        console.error("Error details:", {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        alert(`Failed to create member record: ${error.message}`);
      } else {
        console.log("Member record created successfully:", data);
        setWasCreated(true);
        setCreatedMemberId(data.id);
        
        // Refresh the page to show the update form
        setTimeout(() => {
          router.refresh();
        }, 1000);
      }

    } catch (error) {
      console.error("Unexpected error during member creation:", error);
      alert("An unexpected error occurred while creating your member record.");
    }
    
    setIsCreating(false);
  };

  const getSubmitButtonText = () => {
    if (isCreating) return "Creating Profile...";
    if (wasCreated) return "Profile Created!";
    return "Create Member Profile";
  };

  return (
    <div className="space-y-4">
      <div className="bg-qlack/10 border border-qlack rounded-lg p-4">
        <h3 className="text-lg font-semibold text-qlack mb-2">
          Create Your Member Profile
        </h3>
        <p className="text-qlack text-sm">
          No member profile found for <span className="font-bold">{userEmail}</span> yet!
        </p>
        <p className="text-qlack text-sm mt-1">
          Fill out the form below to create your member profile.
        </p>
      </div>

      <MemberFormFields
        formValues={formValues}
        onFormChange={setFormValues}
        onSubmit={handleSubmit}
        initialBio="<p>Start writing your bio here...</p>"
        submitButtonText={getSubmitButtonText()}
        isLoading={isCreating}
        wasSuccessful={wasCreated}
        successIcon={<Check size="32" />}
        isCreateMode={true}
        memberId={createdMemberId || undefined}
        currentPortrait={undefined}
        onPortraitUploaded={handlePortraitUploaded}
      />

      {wasCreated && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-sm text-green-700 font-medium">
            Your member profile has been created successfully! 
            <br />
            The page will refresh shortly to show your profile for editing.
          </p>
        </div>
      )}
    </div>
  );
}