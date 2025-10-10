"use client";

import { Button } from "@/components/ui/button";
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { Plus } from "lucide-react";
import MenuBar from "@/components/ui/richtext-editor-menu";

interface MemberFormData {
  firstname: string;
  lastname: string;
  jobtitle: string;
  organisation: string;
  country: string;
  maintag: string;
  othertags: string[];
  linkedin: string;
  flags: string[];
  cttetitle: string;
  ctteareas: string;
  biognotes: string;
  joined: string;
  timeline: string[];
  beacon_id?: string;
  beacon_membership?: string;
  beacon_membership_status?: string;
}

interface MemberFormFieldsProps {
  formValues: MemberFormData;
  onFormChange: (values: MemberFormData) => void;
  onSubmit: (biognotes: string) => Promise<void>;
  initialBio?: string;
  submitButtonText: string;
  isLoading: boolean;
  wasSuccessful: boolean;
  successIcon?: React.ReactNode;
  isCreateMode?: boolean; // To differentiate required fields
  userBeaconData?: { // Optional, only needed in create mode
    email: string;
    id: string;
    beacon_membership: string;
    beacon_membership_status: string;
  };
}

export default function MemberFormFields({
  formValues,
  onFormChange,
  onSubmit,
  initialBio = '<p>Start writing your bio here...</p>',
  submitButtonText,
  isLoading,
  wasSuccessful,
  successIcon,
  isCreateMode = false,
  userBeaconData
}: MemberFormFieldsProps) {
  
  const editor = useEditor({
    extensions: [StarterKit],
    content: initialBio,
    immediatelyRender: false,
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const biognotes = editor ? editor.getHTML() : '';
    await onSubmit(biognotes);
  };

  const handleInputChange = (field: keyof MemberFormData, value: string | string[]) => {
    onFormChange({ ...formValues, [field]: value });
  };

  const handleTimelineChange = (index: number, value: string) => {
    const newTimeline = [...formValues.timeline];
    newTimeline[index] = value;
    handleInputChange('timeline', newTimeline);
  };

  const addTimelineEntry = () => {
    handleInputChange('timeline', [...formValues.timeline, '']);
  };

  const removeTimelineEntry = (index: number) => {
    const newTimeline = formValues.timeline.filter((_, i) => i !== index);
    handleInputChange('timeline', newTimeline);
  };

  // Determine which fields are required based on mode
  const firstNameRequired = isCreateMode;
  const lastNameRequired = isCreateMode;
  const jobTitleRequired = isCreateMode;
  const organisationRequired = isCreateMode;
  const countryRequired = isCreateMode;

  return (
    <form onSubmit={handleSubmit} className="form flex flex-col gap-4">
      
      <div className="flex flex-col md:flex-row md:gap-4">
        <label htmlFor="firstname">
          <p>First Name {firstNameRequired ? '*' : ''}</p>
          <input
            type="text"
            name="firstname"
            id="firstname"
            value={formValues.firstname}
            onChange={(e) => handleInputChange('firstname', e.target.value)}
            required={firstNameRequired}
            disabled={isLoading || wasSuccessful}
            className="w-full"
          />
        </label>

        <label htmlFor="lastname">
          <p>Last Name {lastNameRequired ? '*' : ''}</p>
          <input
            type="text"
            name="lastname"
            id="lastname"
            value={formValues.lastname}
            onChange={(e) => handleInputChange('lastname', e.target.value)}
            required={lastNameRequired}
            disabled={isLoading || wasSuccessful}
            className="w-full"
          />
        </label>
      </div>
      
      <label htmlFor="jobtitle">
        <p>Job Title {jobTitleRequired ? '*' : ''}</p>
        <input
          type="text"
          name="jobtitle"
          id="jobtitle"
          value={formValues.jobtitle}
          onChange={(e) => handleInputChange('jobtitle', e.target.value)}
          required={jobTitleRequired}
          disabled={isLoading || wasSuccessful}
          placeholder="e.g., Software Engineer, Marketing Manager"
        />
      </label>

      <label htmlFor="organisation">
        <p>Organisation {organisationRequired ? '*' : ''}</p>
        <input
          type="text"
          name="organisation"
          id="organisation"
          value={formValues.organisation}
          onChange={(e) => handleInputChange('organisation', e.target.value)}
          required={organisationRequired}
          disabled={isLoading || wasSuccessful}
          placeholder="e.g., Company Name, University, etc."
        />
      </label>

      <label htmlFor="country">
        <p>Country {countryRequired ? '*' : ''}</p>
        <input
          type="text"
          name="country"
          id="country"
          value={formValues.country}
          onChange={(e) => handleInputChange('country', e.target.value)}
          required={countryRequired}
          disabled={isLoading || wasSuccessful}
          placeholder="e.g., United Kingdom, United States"
        />
      </label>

      <label htmlFor="joined">
        <p>Joined Date</p>
        <input
          type="date"
          name="joined"
          id="joined"
          value={formValues.joined}
          onChange={(e) => {
            handleInputChange('joined', e.target.value);
            console.log('Joined date changed to:', e.target.value);
          }}
          disabled={isLoading || wasSuccessful}
          className="w-full"
        />
        <p className="text-xs text-gray-500 mt-1">
          When did you join the organization or become a member?
        </p>
      </label>

      <label htmlFor="maintag">
        <p>Company Association (Optional)</p>
        <input
          type="text"
          name="maintag"
          id="maintag"
          value={formValues.maintag}
          onChange={(e) => handleInputChange('maintag', e.target.value)}
          disabled={isLoading || wasSuccessful}
          placeholder="Link to company slug if applicable"
        />
        <p className="text-xs text-gray-500 mt-1">
          If you&apos;re associated with a company in our directory, enter the company slug here
        </p>
      </label>

      <div>
        <p>Bio / Notes</p>
        <MenuBar editor={editor} />
        <div className="border p-8 rounded-b-md bg-grey-50">
          <EditorContent editor={editor} />
        </div>
        <p className="text-xs text-gray-500 mt-1">
          Tell us about yourself, your experience, and your interests
        </p>
      </div>

      <div>
        <p>Notable Achievements and Contributions</p>
        <div className="space-y-2">
          {formValues.timeline.map((entry, index) => (
            <div key={index} className="flex gap-2">
              <input
                type="text"
                value={entry}
                onChange={(e) => handleTimelineChange(index, e.target.value)}
                placeholder="Enter achievement or contribution"
                className="flex-1 border rounded p-2"
                disabled={isLoading || wasSuccessful}
              />
              <Button 
                type="button" 
                onClick={() => removeTimelineEntry(index)}
                variant="outline"
                className="px-3 py-1 text-sm"
                disabled={isLoading || wasSuccessful}
              >
                Remove
              </Button>
            </div>
          ))}
          <Button 
            type="button" 
            onClick={addTimelineEntry}
            variant="outline"
            className="px-3 py-1 text-sm"
            disabled={isLoading || wasSuccessful}
          >
            <Plus className="w-4 h-4 mr-1" />
            Add Achievement
          </Button>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          Add notable achievements, awards, or contributions to the industry
        </p>
      </div>

      {isCreateMode && userBeaconData && (
        <>
          <input 
            type="hidden" 
            name="beacon_id" 
            value={userBeaconData.id ?? ''} 
          />
          <input
            type="hidden"
            name="beacon_membership"
            value={(userBeaconData)?.beacon_membership ?? ''}
          />
          <input 
            type="hidden" 
            name="beacon_membership_status" 
            value="Active" 
          />
        </>
      )}
      
      <div className="flex justify-end">
        <div className="flex items-center gap-1">
          {wasSuccessful && !isLoading && successIcon && (
            <span className="text-green-600">{successIcon}</span>
          )}
          <Button 
            type="submit" 
            disabled={isLoading || wasSuccessful}
            className="px-6 py-2"
          >
            {submitButtonText}
          </Button>
        </div>
      </div>
    </form>
  );
}

// Export the type for use in other components
export type { MemberFormData };