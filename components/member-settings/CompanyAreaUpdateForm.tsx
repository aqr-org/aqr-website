"use client";

import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import { CompanyArea } from "@/lib/types";


interface CompanyAreaUpdateFormProps {
  companyId?: string;
  companyAreas: CompanyArea[];
  onSuccess?: () => void;
}

export default function CompanyAreaUpdateForm({ companyId, companyAreas, onSuccess }: CompanyAreaUpdateFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [wasUpdated, setWasUpdated] = useState(false);
  const [availableAreas, setAvailableAreas] = useState<{[key: string]: string[]}>({});
  const [selectedAreas, setSelectedAreas] = useState<{[key: string]: string[]}>({});

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
        companyAreas?.forEach(area => {
          const category = data.find(d => d.area === area.area)?.category;
          if (category && selectedByCategory[category]) {
            selectedByCategory[category].push(area.area);
          }
        });

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
      console.log("No company ID provided, skipping area update");
      return;
    }
    
    setIsLoading(true);
    
    const supabase = createClient();
    // Flatten all selected areas
    const allSelectedAreas = Object.values(selectedAreas).flat();

    try {
      // Delete existing areas
      await supabase
        .from("company_areas")
        .delete()
        .eq("company_id", companyId);

      // Insert new areas
      if (allSelectedAreas.length > 0) {
        const areasToInsert = allSelectedAreas.map(area => ({
          company_id: companyId,
          area: area
        }));

        await supabase
          .from("company_areas")
          .insert(areasToInsert);
      }

      console.log("Company areas updated successfully");
      setWasUpdated(true);
      if (onSuccess) {
        onSuccess();
      }
      router.refresh();
    } catch (error) {
      console.error("Error updating areas:", error);
    }
    
    setIsLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="form">
      <h3 className="text-lg font-semibold mb-4">Company Areas & Specializations</h3>
      
      <div className="space-y-6">
        {Object.entries(availableAreas).map(([category, areas]) => (
          <div key={category}>
            <p className="mb-3 font-medium">{category}</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-0 overflow-y-auto border p-4 rounded bg-white">
              {areas.map((area) => (
                <label key={area}>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      value={area}
                      checked={selectedAreas[category]?.includes(area) || false}
                      onChange={(e) => handleAreaChange(category, area, e.target.checked)}
                    />
                    <span className="text-sm whitespace-nowrap overflow-hidden">{area}</span>
                  </div>
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
            disabled={isLoading || !companyId}
            className="ml-4"
          >
            {!companyId ? "Create company first" : (isLoading ? "Updating Areas..." : "Update Company Areas")}
          </Button>
        </div>
      </div>
    </form>
  );
}