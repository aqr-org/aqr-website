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
      return;
    }

    setIsCreating(true);
    
    if (!formValues.firstname.trim() || !formValues.lastname.trim()) {
      alert("Please fill in your First Name and Last Name (required fields)");
      setIsCreating(false);
      return;
    }

    const supabase = createClient();

    try {
      // Pre-insert check - verify member doesn't already exist
      const { data: existingMemberByEmail } = await supabase
        .from("members")
        .select("id, email, beacon_id, beacon_membership")
        .eq("email", userEmail)
        .maybeSingle();

      let existingMemberByBeacon = null;
      if (formValues.beacon_id) {
        const { data: memberByBeacon } = await supabase
          .from("members")
          .select("id, email, beacon_id, beacon_membership")
          .eq("beacon_id", formValues.beacon_id)
          .maybeSingle();
        
        if (memberByBeacon) {
          existingMemberByBeacon = memberByBeacon;
        }
      }

      let existingMemberByMembership = null;
      if (formValues.beacon_membership) {
        const { data: memberByMembership } = await supabase
          .from("members")
          .select("id, email, beacon_id, beacon_membership")
          .eq("beacon_membership", formValues.beacon_membership)
          .maybeSingle();
        
        if (memberByMembership) {
          existingMemberByMembership = memberByMembership;
        }
      }

      const existingMember = existingMemberByEmail || existingMemberByBeacon || existingMemberByMembership;
      
      if (existingMember) {
        setIsCreating(false);
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

      const { data, error } = await supabase
        .from("members")
        .insert(insertData)
        .select()
        .single();
      
      if (data && data.id) {
        setWasCreated(true);
        setCreatedMemberId(data.id);
        setIsCreating(false);
        
        setTimeout(() => {
          router.refresh();
        }, 2000);
        return;
      }

      if (error) {
        const isDuplicateError = error.code === '23505' || 
                                  error.message?.includes('duplicate key') ||
                                  error.message?.includes('unique constraint') ||
                                  error.message?.includes('members_member_id_key');

        if (isDuplicateError) {
          setIsCreating(false);
          alert(
            "A member record already exists for your account. The page will refresh to show your profile."
          );
          setTimeout(() => {
            router.refresh();
          }, 500);
          return;
        }

        alert(`Failed to create member record: ${error.message || 'Unknown error'}`);
        setIsCreating(false);
        return;
      }

      if (!data || !data.id) {
        alert("Member record creation completed but no data was returned. Please refresh the page.");
        setIsCreating(false);
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('duplicate') || errorMessage.includes('unique constraint')) {
        setIsCreating(false);
        router.refresh();
        return;
      }
      alert(`An unexpected error occurred while creating your member record: ${errorMessage}`);
      setIsCreating(false);
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