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
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Controlled state for form values - all empty initially
  const [formValues, setFormValues] = useState<MemberFormData>({
    firstname: userBeaconData.firstname || '',
    lastname: userBeaconData.lastname || '',
    jobtitle: '',
    organisation: '',
    country: '',
    joined: userBeaconData.joined || '',
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
  };

  const handleSubmit = async (biognotes: string) => {
    if (isCreating) {
      console.warn("Member profile creation already in progress, ignoring duplicate submission");
      return;
    }

    // Clear any previous error messages
    setErrorMessage(null);
    setIsCreating(true);
    
    console.log("Starting member profile creation for:", userEmail);
    console.log("Form values:", formValues);
    
    if (!formValues.firstname.trim() || !formValues.lastname.trim()) {
      const msg = "Please fill in your First Name and Last Name (required fields)";
      console.error("Validation failed:", msg);
      setErrorMessage(msg);
      setIsCreating(false);
      alert(msg);
      return;
    }

    const supabase = createClient();

    try {
      // Pre-insert check - verify member doesn't already exist
      console.log("Checking for existing member by email:", userEmail);
      const { data: existingMemberByEmail, error: emailCheckError } = await supabase
        .from("members")
        .select("id, email, beacon_id, beacon_membership")
        .eq("email", userEmail)
        .maybeSingle();

      if (emailCheckError) {
        console.error("Error checking existing member by email:", emailCheckError);
      }

      let existingMemberByBeacon = null;
      if (formValues.beacon_id) {
        console.log("Checking for existing member by beacon_id:", formValues.beacon_id);
        const { data: memberByBeacon, error: beaconCheckError } = await supabase
          .from("members")
          .select("id, email, beacon_id, beacon_membership")
          .eq("beacon_id", formValues.beacon_id)
          .maybeSingle();
        
        if (beaconCheckError) {
          console.error("Error checking existing member by beacon_id:", beaconCheckError);
        }
        
        if (memberByBeacon) {
          existingMemberByBeacon = memberByBeacon;
        }
      }

      let existingMemberByMembership = null;
      if (formValues.beacon_membership) {
        console.log("Checking for existing member by beacon_membership:", formValues.beacon_membership);
        const { data: memberByMembership, error: membershipCheckError } = await supabase
          .from("members")
          .select("id, email, beacon_id, beacon_membership")
          .eq("beacon_membership", formValues.beacon_membership)
          .maybeSingle();
        
        if (membershipCheckError) {
          console.error("Error checking existing member by beacon_membership:", membershipCheckError);
        }
        
        if (memberByMembership) {
          existingMemberByMembership = memberByMembership;
        }
      }

      const existingMember = existingMemberByEmail || existingMemberByBeacon || existingMemberByMembership;
      
      if (existingMember) {
        console.log("Existing member found:", existingMember);
        const msg = "A member record already exists for your account. The page will refresh to show your profile.";
        setErrorMessage(msg);
        setIsCreating(false);
        alert(msg);
        setTimeout(() => {
          router.refresh();
        }, 500);
        return;
      }

      // Set legacy_member_id to NULL to avoid unique constraint violation
      // The constraint 'members_member_id_key' is on legacy_member_id with default value ''
      // Multiple NULL values are allowed in unique constraints
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
        timeline: formValues.timeline.filter(item => item.trim() !== ''),
        othertags: formValues.othertags.length > 0 ? formValues.othertags.map(tag => tag.trim()).filter(tag => tag !== '') : null,
        linkedin: formValues.linkedin?.trim() || null,
        flags: formValues.flags.length > 0 ? formValues.flags.map(flag => flag.trim()).filter(flag => flag !== '') : null,
        cttetitle: formValues.cttetitle?.trim() || null,
        ctteareas: formValues.ctteareas?.trim() || null,
        beacon_id: formValues.beacon_id || null,
        beacon_membership: formValues.beacon_membership || null,
        beacon_membership_status: formValues.beacon_membership_status || null,
        legacy_member_id: null,
      };

      console.log("Attempting to insert member profile with data:", insertData);
      const { data, error } = await supabase
        .from("members")
        .insert(insertData)
        .select()
        .single();
      
      if (error) {
        console.error("Error creating member profile:", error);
        console.error("Error details:", {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        console.error("Insert data that failed:", insertData);
        
        const isDuplicateError = error.code === '23505' || 
                                  error.message?.includes('duplicate key') ||
                                  error.message?.includes('unique constraint') ||
                                  error.message?.includes('members_member_id_key');

        if (isDuplicateError) {
          const msg = "A member record already exists for your account. The page will refresh to show your profile.";
          console.log("Duplicate member detected, refreshing page");
          setErrorMessage(msg);
          setIsCreating(false);
          alert(msg);
          setTimeout(() => {
            router.refresh();
          }, 500);
          return;
        }

        // Create a detailed error message for debugging
        const errorDetails = [
          `Error Code: ${error.code || 'N/A'}`,
          `Message: ${error.message || 'No error message'}`,
          error.hint ? `Hint: ${error.hint}` : '',
          error.details ? `Details: ${error.details}` : ''
        ].filter(Boolean).join('\n');
        
        const userFriendlyMsg = `Failed to create member profile. Error: ${error.message || 'Unknown error'}. Please contact support with this error code: ${error.code || 'N/A'}`;
        console.error("Full error details:", errorDetails);
        setErrorMessage(userFriendlyMsg);
        setIsCreating(false);
        alert(userFriendlyMsg);
        return;
      }
      
      if (data && data.id) {
        console.log("Member profile created successfully:", data);
        setWasCreated(true);
        setCreatedMemberId(data.id);
        setErrorMessage(null);
        setIsCreating(false);
        
        setTimeout(() => {
          router.refresh();
        }, 2000);
        return;
      }

      // This case should not happen, but handle it
      const msg = "Member record creation completed but no data was returned. Please refresh the page and try again.";
      console.error("No data returned from insert, but no error either. This is unexpected.");
      console.error("Response data:", data);
      setErrorMessage(msg);
      setIsCreating(false);
      alert(msg);

    } catch (error) {
      console.error("Unexpected error during member profile creation:", error);
      console.error("Error stack:", error instanceof Error ? error.stack : 'No stack trace');
      console.error("Form values at time of error:", formValues);
      
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : '';
      
      if (errorMessage.includes('duplicate') || errorMessage.includes('unique constraint')) {
        const msg = "A member record already exists. Refreshing page...";
        console.log("Duplicate detected in catch block, refreshing");
        setErrorMessage(msg);
        setIsCreating(false);
        router.refresh();
        return;
      }
      
      const userFriendlyMsg = `An unexpected error occurred: ${errorMessage}. Please contact support with this error.`;
      console.error("Full error:", { errorMessage, errorStack });
      setErrorMessage(userFriendlyMsg);
      setIsCreating(false);
      alert(userFriendlyMsg);
    }
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

      {errorMessage && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-700 font-medium">
            <strong>Error:</strong> {errorMessage}
          </p>
          <p className="text-xs text-red-600 mt-2">
            Please check the browser console (F12) for more details. If this problem persists, please contact support with the error details.
          </p>
        </div>
      )}

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
        userBeaconData={userBeaconData}
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