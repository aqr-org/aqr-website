"use client";

import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Check } from "lucide-react";

interface CompanyContactData {
  id: string;
  company_id: string;
  addr1: string | null;
  addr2: string | null;
  addr3: string | null;
  addr4: string | null;
  addr5: string | null;
  postcode: string | null;
  country: string | null;
  phone: string | null;
  email: string | null;
  mobile: string | null;
  website: string | null;
  linkedin: string | null;
  facebook: string | null;
  twitter: string | null;
  youtube: string | null;
  mapref: string | null;
}

interface CompanyContactUpdateFormProps {
  companyId?: string;
  contactData: CompanyContactData | null;
  onSuccess?: () => void;
}

export default function CompanyContactUpdateForm({ companyId, contactData, onSuccess }: CompanyContactUpdateFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [wasUpdated, setWasUpdated] = useState(false);
  
  // Controlled state for form values
  const [formValues, setFormValues] = useState({
    addr1: contactData?.addr1 || '',
    addr2: contactData?.addr2 || '',
    addr3: contactData?.addr3 || '',
    addr4: contactData?.addr4 || '',
    addr5: contactData?.addr5 || '',
    postcode: contactData?.postcode || '',
    country: contactData?.country || '',
    phone: contactData?.phone || '',
    email: contactData?.email || '',
    mobile: contactData?.mobile || '',
    website: contactData?.website || '',
    linkedin: contactData?.linkedin || '',
    facebook: contactData?.facebook || '',
    twitter: contactData?.twitter || '',
    youtube: contactData?.youtube || '',
    mapref: contactData?.mapref || '',
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!companyId) {
      console.log("No company ID provided, skipping contact update");
      return;
    }
    
    setIsLoading(true);
    
    const contactInfo = {
      company_id: companyId,
      addr1: formValues.addr1 || null,
      addr2: formValues.addr2 || null,
      addr3: formValues.addr3 || null,
      addr4: formValues.addr4 || null,
      addr5: formValues.addr5 || null,
      postcode: formValues.postcode || null,
      country: formValues.country || null,
      phone: formValues.phone || null,
      email: formValues.email || null,
      mobile: formValues.mobile || null,
      website: formValues.website || null,
      linkedin: formValues.linkedin || null,
      facebook: formValues.facebook || null,
      twitter: formValues.twitter || null,
      youtube: formValues.youtube || null,
      mapref: formValues.mapref || null,
    };

    console.log("Contact info to save:", contactInfo);

    const supabase = createClient();

    try {
      let result;
      
      if (contactData?.id) {
        // Update existing contact info
        console.log("Updating existing contact info with ID:", contactData.id);
        result = await supabase
          .from("company_contact_info")
          .update(contactInfo)
          .eq("id", contactData.id);
      } else {
        // Insert new contact info
        console.log("Inserting new contact info");
        result = await supabase
          .from("company_contact_info")
          .insert(contactInfo);
      }

      if (result.error) {
        console.error("Error updating company contact info:", result.error);
        console.error("Error details:", JSON.stringify(result.error, null, 2));
      } else {
        console.log("Company contact info updated successfully:", result.data);
        setWasUpdated(true);
        if (onSuccess) {
          onSuccess();
        }
        router.refresh();
      }

    } catch (error) {
      console.error("Unexpected error during contact update:", error);
    }
    
    setIsLoading(false);
  };

  return (
    <div className="">
      <h3 className="text-lg font-semibold mb-4">Company Contact Information</h3>
      <form onSubmit={handleSubmit} className="form space-y-4">
        {/* Address Fields */}
        <div className="grid grid-cols-1 gap-4">
          <h4 className="font-medium text-gray-700">Address</h4>
          
          <div className="grid grid-cols-1 gap-3">
            <label htmlFor="addr1">
              <p className="text-sm font-medium text-gray-600">Address Line 1</p>
              <input
                type="text"
                name="addr1"
                id="addr1"
                value={formValues.addr1}
                onChange={(e) => setFormValues(prev => ({ ...prev, addr1: e.target.value }))}
                placeholder="Street address"
              />
            </label>

            <label htmlFor="addr2">
              <p className="text-sm font-medium text-gray-600">Address Line 2</p>
              <input
                type="text"
                name="addr2"
                id="addr2"
                value={formValues.addr2}
                onChange={(e) => setFormValues(prev => ({ ...prev, addr2: e.target.value }))}
                placeholder="Apartment, suite, etc."
              />
            </label>

            <label htmlFor="addr3">
              <p className="text-sm font-medium text-gray-600">Address Line 3</p>
              <input
                type="text"
                name="addr3"
                id="addr3"
                value={formValues.addr3}
                onChange={(e) => setFormValues(prev => ({ ...prev, addr3: e.target.value }))}
                placeholder="District"
              />
            </label>

            <label htmlFor="addr4">
              <p className="text-sm font-medium text-gray-600">Address Line 4</p>
              <input
                type="text"
                name="addr4"
                id="addr4"
                value={formValues.addr4}
                onChange={(e) => setFormValues(prev => ({ ...prev, addr4: e.target.value }))}
                placeholder="Address Line 4"
              />
            </label>

            <label htmlFor="addr5">
              <p className="text-sm font-medium text-gray-600">Address Line 5</p>
              <input
                type="text"
                name="addr5"
                id="addr5"
                value={formValues.addr5}
                onChange={(e) => setFormValues(prev => ({ ...prev, addr5: e.target.value }))}
                placeholder="Address Line 5"
              />
            </label>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <label htmlFor="postcode">
                <p className="text-sm font-medium text-gray-600">Postcode</p>
                <input
                  type="text"
                  name="postcode"
                  id="postcode"
                  value={formValues.postcode}
                  onChange={(e) => setFormValues(prev => ({ ...prev, postcode: e.target.value }))}
                  placeholder="Postcode"
                />
              </label>

              <label htmlFor="country">
                <p className="text-sm font-medium text-gray-600">Country</p>
                <input
                  type="text"
                  name="country"
                  id="country"
                  value={formValues.country}
                  onChange={(e) => setFormValues(prev => ({ ...prev, country: e.target.value }))}
                  placeholder="Country"
                />
              </label>
            </div>
          </div>
        </div>

        {/* Contact Details */}
        <div className="grid grid-cols-1 gap-4">
          <h4 className="font-medium text-gray-700">Contact Details</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <label htmlFor="phone">
              <p className="text-sm font-medium text-gray-600">Phone</p>
              <input
                type="tel"
                name="phone"
                id="phone"
                value={formValues.phone}
                onChange={(e) => setFormValues(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="+44 20 1234 5678"
              />
            </label>

            <label htmlFor="mobile">
              <p className="text-sm font-medium text-gray-600">Mobile</p>
              <input
                type="tel"
                name="mobile"
                id="mobile"
                value={formValues.mobile}
                onChange={(e) => setFormValues(prev => ({ ...prev, mobile: e.target.value }))}
                placeholder="+44 7123 456789"
              />
            </label>
          </div>

          <label htmlFor="email">
            <p className="text-sm font-medium text-gray-600">Email</p>
            <input
              type="email"
              name="email"
              id="email"
              value={formValues.email}
              onChange={(e) => setFormValues(prev => ({ ...prev, email: e.target.value }))}
              placeholder="contact@company.com"
            />
          </label>

          <label htmlFor="website">
            <p className="text-sm font-medium text-gray-600">Website</p>
            <input
              type="url"
              name="website"
              id="website"
              value={formValues.website}
              onChange={(e) => setFormValues(prev => ({ ...prev, website: e.target.value }))}
              placeholder="https://www.company.com"
            />
          </label>
        </div>

        {/* Social Media */}
        <div className="grid grid-cols-1 gap-4">
          <h4 className="font-medium text-gray-700">Social Media</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <label htmlFor="linkedin">
              <p className="text-sm font-medium text-gray-600">LinkedIn</p>
              <input
                type="text"
                name="linkedin"
                id="linkedin"
                value={formValues.linkedin}
                onChange={(e) => setFormValues(prev => ({ ...prev, linkedin: e.target.value }))}
                placeholder="https://linkedin.com/company/yourcompany"
              />
            </label>

            <label htmlFor="facebook">
              <p className="text-sm font-medium text-gray-600">Facebook</p>
              <input
                type="text"
                name="facebook"
                id="facebook"
                value={formValues.facebook}
                onChange={(e) => setFormValues(prev => ({ ...prev, facebook: e.target.value }))}
                placeholder="https://facebook.com/yourcompany"
              />
            </label>

            <label htmlFor="twitter">
              <p className="text-sm font-medium text-gray-600">Twitter</p>
              <input
                type="text"
                name="twitter"
                id="twitter"
                value={formValues.twitter}
                onChange={(e) => setFormValues(prev => ({ ...prev, twitter: e.target.value }))}
                placeholder="https://twitter.com/yourcompany"
              />
            </label>

            <label htmlFor="youtube">
              <p className="text-sm font-medium text-gray-600">YouTube</p>
              <input
                type="text"
                name="youtube"
                id="youtube"
                value={formValues.youtube}
                onChange={(e) => setFormValues(prev => ({ ...prev, youtube: e.target.value }))}
                placeholder="https://youtube.com/@yourcompany"
              />
            </label>
          </div>
        </div>

        {/* Map Reference */}
        <div className="grid grid-cols-1 gap-4">
          <label htmlFor="mapref">
            <p className="text-sm font-medium text-gray-600">Map Coordinates</p>
            <input
              type="text"
              name="mapref"
              id="mapref"
              value={formValues.mapref}
              onChange={(e) => setFormValues(prev => ({ ...prev, mapref: e.target.value }))}
              placeholder="52.396389,-1.811676"
            />
            <p className="text-xs text-gray-500 mt-1">
              Enter coordinates as &ldquo;latitude,longitude&rdquo; (e.g., 52.396389,-1.811676)
            </p>
          </label>
        </div>

        <div className="flex justify-end pt-4">
          <div className="flex items-center gap-1">
            {wasUpdated && (
              <span className="text-green-600"><Check size="32" /></span>
            )}
            <Button type="submit" disabled={isLoading || !companyId}>
              {!companyId ? "Create company first" : (isLoading ? "Updating..." : "Update Contact Information")}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}