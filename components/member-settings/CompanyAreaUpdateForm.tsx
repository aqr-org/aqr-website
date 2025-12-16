"use client";

import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import {Checkbox} from "@/components/ui/checkbox";
import { useRouter } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import { Check, AlertTriangle } from "lucide-react";
import { CompanyArea, UserBeaconData } from "@/lib/types";


interface CompanyAreaUpdateFormProps {
  companyId?: string;
  companyAreas: CompanyArea[];
  onSuccess?: () => void;
  userBeaconData?: UserBeaconData;
  isSuperAdmin?: boolean;
}

// Function to get area limit based on membership type
function getAreaLimit(allMemberships?: string[]): number | null {
  if (!allMemberships || allMemberships.length === 0) {
    return null; // No limit if no membership info
  }

  const hasBasic = allMemberships.some(m => m.includes("Business Directory Basic"));
  const hasStandard = allMemberships.some(m => m.includes("Business Directory Standard"));
  const hasEnhanced = allMemberships.some(m => m.includes("Business Directory Enhanced"));

  if (hasEnhanced) {
    return null; // Unlimited
  } else if (hasStandard) {
    return 12;
  } else if (hasBasic) {
    return 6;
  }

  return null; // No matching membership found
}

export default function CompanyAreaUpdateForm({ companyId, companyAreas, onSuccess, userBeaconData, isSuperAdmin = false }: CompanyAreaUpdateFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [wasUpdated, setWasUpdated] = useState(false);
  const [availableAreas, setAvailableAreas] = useState<{[key: string]: string[]}>({});
  const [selectedAreas, setSelectedAreas] = useState<{[key: string]: string[]}>({});

  // Calculate area limit based on membership
  const areaLimit = useMemo(() => {
    return getAreaLimit(userBeaconData?.allMemberships);
  }, [userBeaconData?.allMemberships]);

  // Check if user has Enhanced membership (unlimited)
  const hasEnhancedMembership = useMemo(() => {
    return userBeaconData?.allMemberships?.some(m => m.includes("Business Directory Enhanced")) ?? false;
  }, [userBeaconData?.allMemberships]);

  // Calculate total selected count
  const totalSelected = useMemo(() => {
    return Object.values(selectedAreas).flat().length;
  }, [selectedAreas]);

  // Check if over limit (superadmins are subject to company's membership limits)
  const isOverLimit = useMemo(() => {
    if (areaLimit === null) return false; // No limit for unlimited memberships (Enhanced)
    return totalSelected > areaLimit;
  }, [totalSelected, areaLimit]);

  useEffect(() => {
    // Fetch all available areas grouped by category
    const fetchAvailableAreas = async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('areas_master') // Create a master areas table
        .select('area, category')
        .order('category, area');

      if (data && !error) {
        const groupedAreas = data.reduce((acc, item) => {
          if (!acc[item.category]) {
            acc[item.category] = [];
          }
          acc[item.category].push(item.area);
          return acc;
        }, {} as {[key: string]: string[]});

        setAvailableAreas(groupedAreas);

        // Initialize selected areas from company areas with proper fallbacks
        const selectedByCategory: {[key: string]: string[]} = {};
        
        // First, initialize all categories with empty arrays
        Object.keys(groupedAreas).forEach(category => {
          selectedByCategory[category] = [];
        });

        // Then populate with existing company areas
        if (companyAreas && Array.isArray(companyAreas)) {
          companyAreas.forEach(area => {
            const areaName = typeof area === 'string' ? area : area?.area;
            if (areaName) {
              const category = data.find(d => d.area === areaName)?.category;
              if (category && selectedByCategory[category]) {
                selectedByCategory[category].push(areaName);
              }
            }
          });
        }

        setSelectedAreas(selectedByCategory);
      }
    };

    fetchAvailableAreas();
  }, [companyAreas]);

  const handleAreaChange = (category: string, area: string, checked: boolean) => {
    setSelectedAreas(prev => {
      const updated = { ...prev };
      if (!updated[category]) updated[category] = [];
      
      if (checked) {
        updated[category] = [...updated[category], area];
      } else {
        updated[category] = updated[category].filter(a => a !== area);
      }
      
      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!companyId) {
      return;
    }

    // Prevent submission if over limit
    if (isOverLimit) {
      return;
    }
    
    setIsLoading(true);
    
    const supabase = createClient();
    // Flatten all selected areas
    const allSelectedAreas = Object.values(selectedAreas).flat();

    try {
      // Delete existing areas
      const { error: deleteError } = await supabase
        .from("company_areas")
        .delete()
        .eq("company_id", companyId);

      if (deleteError) {
        console.error("Error deleting existing areas:", deleteError);
        alert(`Failed to update areas: ${deleteError.message}`);
        setIsLoading(false);
        return;
      }

      // Insert new areas
      if (allSelectedAreas.length > 0) {
        const areasToInsert = allSelectedAreas.map(area => ({
          company_id: companyId,
          area: area
        }));

        const { error: insertError } = await supabase
          .from("company_areas")
          .insert(areasToInsert);

        if (insertError) {
          console.error("Error inserting areas:", insertError);
          alert(`Failed to save areas: ${insertError.message}`);
          setIsLoading(false);
          return;
        }
      }

      setWasUpdated(true);
      if (onSuccess) {
        onSuccess();
      }
      router.refresh();
    } catch (error) {
      console.error("Unexpected error updating areas:", error);
      alert("An unexpected error occurred while updating areas.");
    }
    
    setIsLoading(false);
  };

  const businessMembershipTier = useMemo(() => {
    return userBeaconData?.allMemberships?.filter(membership => membership.includes('Business Directory')) || [];
  }, [userBeaconData?.allMemberships]);

  return (
    <div className="relative">
      {/* Sticky indicator */}
      {(areaLimit !== null || hasEnhancedMembership || isSuperAdmin) && (
        <div className={`sticky top-32 z-50 mb-4 -mx-4 p-4 rounded-lg border-2 transition-all backdrop-blur-sm shadow-lg ${
          isOverLimit 
            ? 'bg-qrose/95 border-qrose shadow-lg' 
            : 'bg-qreen-dark/95 border-qreen-dark'
        }`}>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
            <div className="flex items-center gap-2 leading-tight">
              {isOverLimit && <AlertTriangle className="w-5 h-5 shrink-0 text-qaupe" />}
              <span className={`font-semibold ${isOverLimit ? 'text-qaupe' : 'text-qaupe'}`}>
                Search Criteria selected: {totalSelected}{areaLimit === null ? '' : `/${areaLimit}`} <br /> 
                <span className="text-xs text-qaupe font-normal">
                  {isSuperAdmin 
                    ? `(Superadmin${businessMembershipTier.length > 0 ? ` - ${businessMembershipTier.join(', ')}` : ' - No Business Directory membership found'})` 
                    : `(${businessMembershipTier.length > 0 ? businessMembershipTier.join(', ') : 'No membership'})`}
                </span>
              </span>
            </div>
            {isOverLimit && (
              <span className="text-sm text-qaupe font-medium">
                You have selected {totalSelected - (areaLimit || 0)} more than your limit. Please deselect some areas to continue.
              </span>
            )}
            {!isOverLimit && areaLimit !== null && areaLimit > 0 && (
              <span className="text-sm text-qaupe">
                {areaLimit - totalSelected} remaining
              </span>
            )}
            {!isOverLimit && hasEnhancedMembership && areaLimit === null && (
              <span className="text-sm text-qaupe">
                Unlimited areas available
              </span>
            )}
            {!isOverLimit && isSuperAdmin && areaLimit === null && !hasEnhancedMembership && businessMembershipTier.length === 0 && (
              <span className="text-sm text-qaupe">
                No Business Directory membership found for this company
              </span>
            )}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="form">
        <h3 className="text-lg font-semibold mb-4">Company Areas & Specializations</h3>
        
        <div className="space-y-6">
          {Object.entries(availableAreas).map(([category, areas]) => (
            <div key={category}>
              <p className="mb-3 font-medium">{category}</p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-0 overflow-y-auto p-4 rounded bg-white/80">
                {areas.map((area) => (
                  <label key={area} className="flex items-center gap-2 nowrap cursor-pointer">
                    <Checkbox
                      checked={selectedAreas[category]?.includes(area) || false}
                      onCheckedChange={(checked) => handleAreaChange(category, area, checked === true)}
                    />
                    <span className="group text-sm text-qreen-dark whitespace-nowrap mr-2 overflow-hidden hover:overflow-visible hover:z-100 hover:relative">
                      <span className="relative z-20">
                        {area}
                      </span>
                      <span className="hidden group-hover:block absolute -left-2 -right-2 -top-1 -bottom-1 inset-0 bg-white rounded-md z-10 border-8 border-qaupe shadow-lg" />
                    </span>
                  </label>
                ))}
              </div>
              <p className="text-xs text-slate-500 mt-2">
                Selected: {selectedAreas[category]?.length || 0} {category.toLowerCase()}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-6 flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Total selected: {Object.values(selectedAreas).flat().length} areas
          </p>
          <div className="flex items-center gap-1">
            {wasUpdated && (
              <span className="text-green-600"><Check size="32" /></span>
            )}
            <Button 
              type="submit" 
              disabled={isLoading || !companyId || isOverLimit}
              className="ml-4 bg-qreen border-qreen text-qaupe"
            >
              {!companyId 
                ? "Create company first" 
                : isOverLimit 
                  ? "Too many areas selected" 
                  : (isLoading ? "Updating Areas..." : "Update Company Areas")}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}