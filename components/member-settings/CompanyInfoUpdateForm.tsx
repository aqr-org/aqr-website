"use client";

import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { Check, Upload, X } from "lucide-react";
import { profOrgsNameMap } from "@/lib/utils";
import Image from "next/image";
import MenuBar from "@/components/ui/richtext-editor-menu";

interface CompanyData {
  id?: string;
  name: string;
  type: string;
  established: number;
  companysize: string;
  narrative: string;
  gradprog: string;
  proforgs: string;
  prsaward: string;
  accred: string;
  logo: string;
}

interface CompanyInfoUpdateFormProps {
  companyData: CompanyData | null;
  onSuccess?: (companyId: string) => void;
  beaconData?: {
    organizations: { id: string; name: string }[];
    hasCurrentMembership: boolean;
  };
  isSuperAdmin?: boolean;
}

const companyTypeValues = [
  "Unspecified",
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

const accreditationValues = [
  "ISO 27001",
  "ISO 20252", 
  "ISO 9001",
  "ISO 17100"
];

export default function CompanyInfoUpdateForm({ companyData, onSuccess, beaconData, isSuperAdmin = false }: CompanyInfoUpdateFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [wasUpdated, setWasUpdated] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Controlled state for form values
  const [formValues, setFormValues] = useState({
    companyName: companyData?.name || '',
    type: companyData?.type || companyTypeValues[0],
    companysize: companyData?.companysize || companySizeValues[0],
    established: companyData?.established || new Date().getFullYear(),
    gradprog: companyData?.gradprog === "Yes" || companyData?.gradprog === "YES" ? "Yes" : "No",
    profOrgs: companyData?.proforgs || null,
    prsaward: companyData?.prsaward || null,
    accred: companyData?.accred || null,
    logo: companyData?.logo || ''
  });

  const editor = useEditor({
    extensions: [StarterKit],
    content: companyData ? companyData.narrative : 'Start writing here...',
    immediatelyRender: false,
  })

  // Load existing logo from storage when component mounts or company ID changes
  useEffect(() => {
    const loadExistingLogo = async () => {
      if (!companyData?.id) return;
      
      const supabase = createClient();
      
      try {
        // List files in companies folder that start with company ID
        const { data: files } = await supabase.storage
          .from('images')
          .list('companies', {
            search: companyData.id
          });
        
        if (files && files.length > 0) {
          // Find file that starts with company ID
          const logoFile = files.find(f => f.name.startsWith(companyData.id!));
          
          if (logoFile) {
            const { data: urlData } = supabase.storage
              .from('images')
              .getPublicUrl(`companies/${logoFile.name}`);
            
            setFormValues(prev => ({ ...prev, logo: urlData.publicUrl }));
          }
        }
      } catch (error) {
        console.error('Error loading existing logo:', error);
      }
    };
    
    loadExistingLogo();
  }, [companyData?.id]);

  // Logo upload handlers
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
      
      setLogoFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setLogoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLogoUpload = async (companyId?: string): Promise<boolean> => {
    const targetCompanyId = companyId || companyData?.id;
    if (!logoFile || !targetCompanyId) return false;

    setIsUploadingLogo(true);
    const supabase = createClient();

    try {
      
      // Try both with search parameter and without to see all files
      const { data: allFiles } = await supabase.storage
        .from('images')
        .list('companies');

        const { data: existingFiles, error: listError } = await supabase.storage
          .from('images')
          .list('companies', {
            search: targetCompanyId
          });

      if (listError) {
        console.error('Error listing existing files:', listError);
      } else {
        console.log('Found existing files with search:', existingFiles);
      }

      // Delete all files that start with the company ID
      let filesToDelete: string[] = [];

      // Method 1: Use search results if available
      if (existingFiles && existingFiles.length > 0) {
        filesToDelete = existingFiles
          .filter(file => file.name.startsWith(targetCompanyId))
          .map(file => `companies/${file.name}`);
      }

      // Method 2: Fallback - manually filter all files if search didn't work
      if (filesToDelete.length === 0 && allFiles && allFiles.length > 0) {
        console.log('Search method found no files, trying manual filter');
        filesToDelete = allFiles
          .filter(file => file.name.startsWith(targetCompanyId))
          .map(file => `companies/${file.name}`);
      }

      console.log('Files matching company ID:', filesToDelete);

      if (filesToDelete.length > 0) {
        console.log('Attempting to delete existing logos:', filesToDelete);
        const { error: deleteError } = await supabase.storage
          .from('images')
          .remove(filesToDelete);

        if (deleteError) {
          console.error('Error deleting existing logos:', deleteError);
        } else {
          console.log('Successfully deleted existing logos:', filesToDelete);
        }
      } else {
        console.log('No files found that start with company ID:', targetCompanyId);
      }

      // Get file extension
      const fileExt = logoFile.name.split('.').pop();
      const fileName = `${targetCompanyId}.${fileExt}`;

      // Upload new logo
      const { error: uploadError } = await supabase.storage
        .from('images')
        .upload(`companies/${fileName}`, logoFile, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        alert('Failed to upload logo');
        setIsUploadingLogo(false);
        return false;
      }

      // Get public URL 
      const { data: urlData } = supabase.storage
        .from('images')
        .getPublicUrl(`companies/${fileName}`);

      // Store clean URL in database, but use cache-busted for immediate display
      const cleanUrl = urlData.publicUrl;
      const cacheBustedUrl = `${cleanUrl}?t=${Date.now()}`;

      console.log('Clean logo URL:', cleanUrl);
      console.log('Cache-busted URL:', cacheBustedUrl);
      console.log('Upload completed for file:', fileName);

      // Update form state with cache-busted URL (for immediate display)
      // The database will get the clean URL when form is submitted
      setFormValues(prev => ({ ...prev, logo: cacheBustedUrl }));

      // Clear upload state
      setLogoFile(null);
      setLogoPreview(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      console.log('Logo uploaded successfully:', fileName);
      setIsUploadingLogo(false);
      return true;

    } catch (error) {
      console.error('Logo upload error:', error);
      alert('Failed to upload logo');
      setIsUploadingLogo(false);
      return false;
    }
  };

  const clearLogoSelection = () => {
    setLogoFile(null);
    setLogoPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleLogoUploadClick = async () => {
    await handleLogoUpload();
  };

  // Convert to regular event handler instead of server action
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    
    const narrative = editor ? editor.getHTML() : '';
    
    // If the user has selected a logo file but not uploaded it yet, upload it first
    // Only attempt logo upload if we have a company ID (update mode)
    if (logoFile && companyData?.id) {
      console.log('Logo file selected but not uploaded - uploading now...');
      const uploaded = await handleLogoUpload();
      if (!uploaded) {
        console.error('Logo upload failed - aborting form submission');
        setIsLoading(false);
        return;
      }
      console.log('Logo uploaded successfully, continuing with form submission');
    } else if (logoFile && !companyData?.id) {
      console.log('Logo file selected but company not created yet - will upload after company creation');
    }
    
    // Basic validation
    if (!formValues.companyName || !formValues.type || !formValues.companysize || !formValues.established || !formValues.gradprog || !narrative) {
      console.error("All fields are required.");
      console.error("Missing fields:", {
        companyName: formValues.companyName,
        type: formValues.type,
        companysize: formValues.companysize,
        established: formValues.established,
        gradprog: formValues.gradprog,
        narrative: narrative
      });
      setIsLoading(false);
      return;
    }

    const supabase = createClient();

    try {
      const companyDataToSave = {
        name: formValues.companyName.trim(),
        type: formValues.type,
        companysize: formValues.companysize,
        established: formValues.established,
        gradprog: formValues.gradprog,
        narrative: narrative,
        proforgs: formValues.profOrgs?.trim() || null,
        prsaward: formValues.prsaward?.trim() || null,
        accred: formValues.accred?.trim() || null,
        // Add the required beacon fields when creating
        ...(companyData?.id ? {} : {
          beacon_membership_id: beaconData?.organizations?.[0]?.id || null,
          beacon_membership_status: beaconData?.hasCurrentMembership ? 'Active' : null,
        })
      };
      
      let result;
      
      if (companyData?.id) {
        
        result = await supabase
          .from("companies")
          .update(companyDataToSave)
          .eq("id", companyData.id);
      } else {
        
        result = await supabase
          .from("companies")
          .insert(companyDataToSave)
          .select()
          .single();
      }

      if (result.error) {
        console.error("Error with company operation:", result.error);
        console.error("Error details:", {
          message: result.error.message,
          details: result.error.details,
          hint: result.error.hint,
          code: result.error.code
        });
        alert(`Failed to ${companyData?.id ? 'update' : 'create'} company data: ${result.error.message}`);
      } else {
        console.log(`Company ${companyData?.id ? 'updated' : 'created'} successfully:`, result.data);
        setWasUpdated(true);
        
        // If this was a create operation, handle logo upload and call onSuccess
        if (!companyData?.id && result.data?.id) {
          // If there's a logo file selected, upload it now that we have a company ID
          if (logoFile) {
            console.log('Company created, now uploading logo...');
            try {
              const logoUploaded = await handleLogoUpload(result.data.id);
              if (logoUploaded) {
                console.log('Logo uploaded successfully after company creation');
              } else {
                console.warn('Logo upload failed after company creation');
              }
            } catch (error) {
              console.error('Error uploading logo after company creation:', error);
            }
          }
          
          if (onSuccess) {
            onSuccess(result.data.id);
          }
        }
        
        router.refresh();
      }

    } catch (error) {
      console.error("Unexpected error during company update:", error);
    }
    
    setIsLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="form flex flex-col gap-4">

      <label htmlFor="companyName" className="group relative">
        <p>Company Name</p>
        <input
          type="text"
          name="companyName"
          id="companyName"
          value={formValues.companyName}
          onChange={(e) => setFormValues(prev => ({ ...prev, companyName: e.target.value }))}
          required
          disabled={!isSuperAdmin}
        />
        {!isSuperAdmin && (
          <fieldset className="mt-2 border-0 p-0 m-0 absolute top-0 left-0 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <legend className="text-xs text-qrose rounded bg-qaupe shadow-md border border-qrose p-2 block leading-[1.1] max-w-[30rem]">
              Your company name has to match the record you provided to AQR, that is why you can't edit it here. If you need to change it, please contact support.
            </legend>
          </fieldset>
        )}
      </label>

      <div>
        
        <div className="flex gap-4">
          {/* Current Logo Display */}
          {formValues.logo && (
            <div className={`mb-4 ${logoPreview ? 'opacity-50' : ''}`}>
              <div className="relative w-[200px] h-[100px] overflow-hidden">
              <p className="absolute z-10 text-xs bg-gray-200 inline-block px-1 rounded">Current Logo</p>
                <Image 
                  key={formValues.logo} // Force re-render when URL changes
                  src={formValues.logo} 
                  alt="Current company logo" 
                  fill
                  sizes="200px"
                  className="w-[200px] object-contain bg-gray-300 p-4 rounded"
                  unoptimized // Disable Next.js optimization to avoid caching issues
                />
              </div>
            </div>
          )}
          
          {/* No logo placeholder */}
          {!formValues.logo && !logoPreview && companyData?.id && (
            <div className="mb-4">
              <div className="relative w-[200px] h-[100px] overflow-hidden">
                <div className="w-full h-full bg-gray-200 rounded flex items-center justify-center">
                  <p className="text-gray-500 text-sm">No logo uploaded</p>
                </div>
              </div>
            </div>
          )}
          
          {/* Logo Preview */}
          {logoPreview && (
            <div className={`mb-4`}>
              <div className="relative w-[200px] h-[100px] overflow-hidden">
              <p className="absolute z-10 text-xs bg-gray-200 inline-block px-1 rounded">New Logo Preview</p>
                <Image 
                  src={logoPreview} 
                  alt="Logo preview" 
                  fill
                  sizes="200px"
                  className="w-[200px] object-contain bg-gray-300 p-4 rounded"
                />
              </div>
              <div className="flex gap-2 mt-2">
                <Button 
                  type="button" 
                  onClick={handleLogoUploadClick} 
                  disabled={isUploadingLogo}
                  className="px-3 py-1 text-sm"
                > 
                  <Upload className="w-4 h-4 text-gray-400" />
                  {isUploadingLogo ? "Uploading..." : "Upload Logo"}
                </Button>
                <Button 
                  type="button" 
                  onClick={clearLogoSelection} 
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
        {!logoPreview && (
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
          Supported formats: JPG, PNG, GIF, SVG, WebP. Max size: 2MB
        </p>
      </div>
      
      <div className="flex flex-col md:flex-row md:gap-4">

        <label htmlFor="type">
          <p>Type</p>
          <select 
            name="type" 
            id="type" 
            value={formValues.type}
            onChange={(e) => setFormValues(prev => ({ ...prev, type: e.target.value }))}
          >
            {companyTypeValues.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </label>
        
        <label htmlFor="companysize">
          <p>Company Size</p>
          <select 
            name="companysize" 
            id="companysize" 
            value={formValues.companysize}
            onChange={(e) => setFormValues(prev => ({ ...prev, companysize: e.target.value }))}
          >
            {companySizeValues.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </label>

      </div>
      <div className="flex flex-col md:flex-row md:gap-4">

        <label htmlFor="established">
          <p>Established</p>
          <input
            type="number"
            name="established"
            id="established"
            min="1900"
            max={new Date().getFullYear()}
            step="1"
            value={formValues.established}
            onChange={(e) => setFormValues(prev => ({ ...prev, established: parseInt(e.target.value) || new Date().getFullYear() }))}
          />
        </label>

        <label htmlFor="gradprog">
          <p>Do you offer a Grad Programme?</p>
          <select 
            name="gradprog" 
            id="gradprog" 
            value={formValues.gradprog}
            onChange={(e) => setFormValues(prev => ({ ...prev, gradprog: e.target.value }))}
          >
            <option value="Yes">Yes</option>
            <option value="No">No</option>
          </select>
        </label>
      </div>

      
      <div>
        <p>Professional Organizations</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-0 overflow-y-auto border p-4 rounded bg-white">
          {Object.entries(profOrgsNameMap).map(([key, value]) => (
            <label key={key}>
              <div className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  value={key}
                  checked={formValues.profOrgs?.split(',').includes(key) || false}
                  onChange={(e) => {
                    const currentOrgs = formValues.profOrgs?.split(',').filter(org => org) || [];
                    let updatedOrgs;
                    
                    if (e.target.checked) {
                      updatedOrgs = [...currentOrgs, key];
                    } else {
                      updatedOrgs = currentOrgs.filter(org => org !== key);
                    }
                    
                    setFormValues(prev => ({ 
                      ...prev, 
                      profOrgs: updatedOrgs.length > 0 ? updatedOrgs.join(',') : null 
                    }));
                  }}
                />
                <span title={value} className="text-sm whitespace-nowrap w-full overflow-hidden text-ellipsis">{value}</span>
              </div>
            </label>
          ))}
        </div>
      </div>

      <div>
        <p>Standards Compliance Accreditations</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-0 overflow-y-auto border p-4 rounded bg-white">
          {accreditationValues.map((accreditation) => (
            <label key={accreditation}>
              <div className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  value={accreditation}
                  checked={formValues.accred?.split(',').includes(accreditation) || false}
                  onChange={(e) => {
                    const currentAccreds = formValues.accred?.split(',').filter(acc => acc) || [];
                    let updatedAccreds;
                    
                    if (e.target.checked) {
                      updatedAccreds = [...currentAccreds, accreditation];
                    } else {
                      updatedAccreds = currentAccreds.filter(acc => acc !== accreditation);
                    }
                    
                    setFormValues(prev => ({ 
                      ...prev, 
                      accred: updatedAccreds.length > 0 ? updatedAccreds.join(',') : null 
                    }));
                  }}
                />
                <span className="text-sm whitespace-nowrap w-full overflow-hidden text-ellipsis">{accreditation}</span>
              </div>
            </label>
          ))}
        </div>
      </div>

      <div>
        {isSuperAdmin &&
          <p>AQR Awards (Enter award years, e.g., 2020,2021)</p>
        }
        <textarea
          name="prsaward"
          hidden={!isSuperAdmin}
          id="prsaward"
          rows={3}
          value={formValues.prsaward || ''}
          onChange={(e) => setFormValues(prev => ({ ...prev, prsaward: e.target.value || null }))}
          placeholder="Enter award years separated by commas (e.g., 2015,2020,2023)"
          className="w-full border rounded p-2"
        />
        {isSuperAdmin &&
        <p className="text-xs text-gray-500 mt-1">
          Awards before 2016 will display as &ldquo;Prosper Riley-Smith Qualitative Effectiveness Award Winner&rdquo;, 
          awards from 2016 onwards will display as &ldquo;AQR Qualitative Excellence Award Winner&rdquo;
        </p>
        }
        {formValues.prsaward && (
          <div className="mt-2 p-2 bg-gray-100 rounded text-sm">
            <p className="font-medium">Preview:</p>
            <ul className="mt-1">
              {formValues.prsaward.split(',').map((year, index) => {
                const trimmedYear = year.trim();
                if (!trimmedYear) return null;
                const awardName = Number(trimmedYear) < 2016 
                  ? `Prosper Riley-Smith Qualitative Effectiveness Award Winner ${trimmedYear}`
                  : `AQR Qualitative Excellence Award Winner ${trimmedYear}`;
                return <li key={index}>• {awardName}</li>;
              })}
            </ul>
          </div>
        )}
      </div>

      <div>
        <p>Company Bio</p>
        <MenuBar editor={editor} />
        <div className="border p-8 rounded-b-md bg-qitrus/20">
          <EditorContent editor={editor} />
        </div>
      </div>
      
      <div className="flex justify-end">
        <div className="flex items-center gap-1">
          {wasUpdated && (
            <span className="text-green-600"><Check size="32" /></span>
          )}
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (companyData?.id ? "Updating..." : "Creating...") : (companyData?.id ? "Update company data" : "Create company")}
          </Button>
        </div>
      </div>
    </form>
  );
}