"use client";

import { Button } from "@/components/ui/button";
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { Plus, Upload, X } from "lucide-react";
import MenuBar from "@/components/ui/richtext-editor-menu";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { useState, useRef, useEffect } from "react";
import type { MemberFormData, MemberFormFieldsProps } from '@/lib/types/members';

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
  userBeaconData,
  memberId,
  currentPortrait,
  onPortraitUploaded
}: MemberFormFieldsProps) {
  
  const editor = useEditor({
    extensions: [StarterKit],
    content: initialBio,
    immediatelyRender: false,
  });

  // Load existing portrait from storage when component mounts or member ID changes
  useEffect(() => {
    const loadExistingPortrait = async () => {
      if (!memberId) return;
      
      const supabase = createClient();
      
      try {
        // List files in members folder that start with member ID
        const { data: files } = await supabase.storage
          .from('images')
          .list('members', {
            search: memberId
          });
        
        if (files && files.length > 0) {
          const portraitFile = files.find(f => f.name.startsWith(memberId));
          
          if (portraitFile) {
            const { data: urlData } = supabase.storage
              .from('images')
              .getPublicUrl(`members/${portraitFile.name}`);
            
            setCurrentPortraitUrl(urlData.publicUrl);
          }
        }
      } catch (error) {
        console.error('Error loading existing portrait:', error);
      }
    };
    
    loadExistingPortrait();
  }, [memberId]);

  // Portrait upload state
  const [portraitFile, setPortraitFile] = useState<File | null>(null);
  const [portraitPreview, setPortraitPreview] = useState<string | null>(null);
  const [isUploadingPortrait, setIsUploadingPortrait] = useState(false);
  const [currentPortraitUrl, setCurrentPortraitUrl] = useState<string | null>(currentPortrait || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  // Portrait upload handlers
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB');
        return;
      }
      
      setPortraitFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPortraitPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePortraitUpload = async (targetMemberId?: string): Promise<boolean> => {
    const memberIdToUse = targetMemberId || memberId;
    if (!portraitFile || !memberIdToUse) return false;

    setIsUploadingPortrait(true);
    const supabase = createClient();

    try {
      // First, list all files in the members folder to find existing portraits
      console.log('Searching for existing files with member ID:', memberIdToUse);

      const { data: allFiles } = await supabase.storage
        .from('images')
        .list('members');

      console.log('All files in members folder:', allFiles);

      const { data: existingFiles, error: listError } = await supabase.storage
        .from('images')
        .list('members', {
          search: memberIdToUse
        });

      if (listError) {
        console.error('Error listing existing files:', listError);
      } else {
        console.log('Found existing files with search:', existingFiles);
      }

      // Delete all files that start with the member ID
      let filesToDelete: string[] = [];

      // Method 1: Use search results if available
      if (existingFiles && existingFiles.length > 0) {
        filesToDelete = existingFiles
          .filter(file => file.name.startsWith(memberIdToUse))
          .map(file => `members/${file.name}`);
      }

      // Method 2: Fallback - manually filter all files if search didn't work
      if (filesToDelete.length === 0 && allFiles && allFiles.length > 0) {
        console.log('Search method found no files, trying manual filter');
        filesToDelete = allFiles
          .filter(file => file.name.startsWith(memberIdToUse))
          .map(file => `members/${file.name}`);
      }

      console.log('Files matching member ID:', filesToDelete);

      if (filesToDelete.length > 0) {
        console.log('Attempting to delete existing portraits:', filesToDelete);
        const { error: deleteError } = await supabase.storage
          .from('images')
          .remove(filesToDelete);

        if (deleteError) {
          console.error('Error deleting existing portraits:', deleteError);
        } else {
          console.log('Successfully deleted existing portraits:', filesToDelete);
        }
      } else {
        console.log('No files found that start with member ID:', memberIdToUse);
      }

      // Get file extension
      const fileExt = portraitFile.name.split('.').pop();
      const fileName = `${memberIdToUse}.${fileExt}`;

      // Upload new portrait
      const { error: uploadError } = await supabase.storage
        .from('images')
        .upload(`members/${fileName}`, portraitFile, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        alert('Failed to upload portrait');
        setIsUploadingPortrait(false);
        return false;
      }

      // Get public URL 
      const { data: urlData } = supabase.storage
        .from('images')
        .getPublicUrl(`members/${fileName}`);

      // Store clean URL in database, but use cache-busted for immediate display
      const cleanUrl = urlData.publicUrl;
      const cacheBustedUrl = `${cleanUrl}?t=${Date.now()}`;

      console.log('Clean portrait URL:', cleanUrl);
      console.log('Cache-busted URL:', cacheBustedUrl);
      console.log('Upload completed for file:', fileName);

      // Update local state for display
      setCurrentPortraitUrl(cacheBustedUrl);

      // Call callback if provided
      if (onPortraitUploaded) {
        onPortraitUploaded(cleanUrl);
      }

      // Clear upload state
      setPortraitFile(null);
      setPortraitPreview(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      console.log('Portrait uploaded successfully:', fileName);
      setIsUploadingPortrait(false);
      return true;

    } catch (error) {
      console.error('Portrait upload error:', error);
      alert('Failed to upload portrait');
      setIsUploadingPortrait(false);
      return false;
    }
  };

  const clearPortraitSelection = () => {
    setPortraitFile(null);
    setPortraitPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handlePortraitUploadClick = async () => {
    await handlePortraitUpload();
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
        <p>Portrait Photo</p>
        
        <div className="flex gap-4">
          {/* Current Portrait Display */}
          {currentPortraitUrl && (
            <div className={`mb-4 ${portraitPreview ? 'opacity-50' : ''}`}>
              <div className="relative w-[150px] h-[150px] overflow-hidden">
                <p className="absolute z-10 text-xs bg-gray-200 inline-block px-1 rounded">Current Portrait</p>
                <Image 
                  key={currentPortraitUrl} // Force re-render when URL changes
                  src={currentPortraitUrl} 
                  alt="Current member portrait" 
                  fill
                  sizes="150px"
                  className="w-[150px] h-[150px] object-cover bg-gray-300 rounded-full"
                  unoptimized // Disable Next.js optimization to avoid caching issues
                />
              </div>
            </div>
          )}
          
          {/* No portrait placeholder */}
          {!currentPortraitUrl && !portraitPreview && memberId && (
            <div className="mb-4">
              <div className="relative w-[150px] h-[150px] overflow-hidden">
                <div className="w-full h-full bg-gray-200 rounded-full flex items-center justify-center">
                  <p className="text-gray-500 text-sm text-center px-4">No portrait uploaded</p>
                </div>
              </div>
            </div>
          )}
          
          {/* Portrait Preview */}
          {portraitPreview && (
            <div className={`mb-4`}>
              <div className="relative w-[150px] h-[150px] overflow-hidden">
                <p className="absolute z-10 text-xs bg-gray-200 inline-block px-1 rounded">New Portrait Preview</p>
                <Image 
                  src={portraitPreview} 
                  alt="Portrait preview" 
                  fill
                  sizes="150px"
                  className="w-[150px] h-[150px] object-cover bg-gray-300 rounded-full"
                />
              </div>
              <div className="flex gap-2 mt-2">
                <Button 
                  type="button" 
                  onClick={handlePortraitUploadClick} 
                  disabled={isUploadingPortrait || !memberId}
                  className="px-3 py-1 text-sm"
                > 
                  <Upload className="w-4 h-4 text-gray-400" />
                  {isUploadingPortrait ? "Uploading..." : "Upload Portrait"}
                </Button>
                <Button 
                  type="button" 
                  onClick={clearPortraitSelection} 
                  variant="secondary" 
                  className="px-3 py-1 text-sm"
                >
                  <X className="w-4 h-4 mr-1" />
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
        
        {/* File Input */}
        {!portraitPreview && (
          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="
                block w-full text-sm text-gray-500 bg-transparent 
                file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-700 file:text-blue-50 file:cursor-pointer hover:file:bg-blue-600
              "
            />
            <Upload className="w-4 h-4 text-gray-400" />
          </div>
        )}
        
        <p className="text-xs text-gray-500 mt-1">
          Supported formats: JPG, PNG, GIF, SVG, WebP. Max size: 5MB. 
          {!memberId && " Portrait will be uploaded after member creation."}
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
                variant="secondary"
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
            variant="secondary"
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
            value={userBeaconData.personId ?? ''} 
          />
          <input
            type="hidden"
            name="beacon_membership"
            value={(userBeaconData)?.id ?? ''}
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
export type { MemberFormData } from '@/lib/types/members';