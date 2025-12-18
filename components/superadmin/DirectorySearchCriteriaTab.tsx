"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface AreaMaster {
  id: string;
  area: string;
  category: string;
}

export default function DirectorySearchCriteriaTab() {
  const [areasMaster, setAreasMaster] = useState<AreaMaster[]>([]);
  const [isLoadingAreas, setIsLoadingAreas] = useState(false);
  const [editingAreaId, setEditingAreaId] = useState<string | null>(null);
  const [editingAreaName, setEditingAreaName] = useState<Record<string, string>>({});
  const [newAreaName, setNewAreaName] = useState<Record<string, string>>({});
  const [isAddingArea, setIsAddingArea] = useState<Record<string, boolean>>({});
  const [isUpdatingArea, setIsUpdatingArea] = useState<Record<string, boolean>>({});
  const [isDeletingArea, setIsDeletingArea] = useState<Record<string, boolean>>({});
  const [deleteAreaModalOpen, setDeleteAreaModalOpen] = useState(false);
  const [areaToDelete, setAreaToDelete] = useState<{ area: string; category: string } | null>(null);
  const [deleteAreaConfirmationText, setDeleteAreaConfirmationText] = useState('');

  // Fetch areas master data
  useEffect(() => {
    const fetchAreasMaster = async () => {
      setIsLoadingAreas(true);
      const supabase = createClient();
      const { data, error } = await supabase
        .from('areas_master')
        .select('id, area, category')
        .order('category, area');

      if (error) {
        console.error('Error fetching areas master:', error);
      } else {
        setAreasMaster(data || []);
      }
      setIsLoadingAreas(false);
    };

    fetchAreasMaster();
  }, []);

  // Group areas by category
  const areasByCategory = areasMaster.reduce((acc, area) => {
    if (!acc[area.category]) {
      acc[area.category] = [];
    }
    acc[area.category].push(area);
    return acc;
  }, {} as Record<string, AreaMaster[]>);

  // Directory Search Criteria CRUD functions
  const addArea = async (category: string) => {
    const areaName = newAreaName[category]?.trim();
    if (!areaName) {
      alert('Please enter an area name');
      return;
    }

    setIsAddingArea({ ...isAddingArea, [category]: true });
    const supabase = createClient();

    const { data, error } = await supabase
      .from('areas_master')
      .insert({
        area: areaName,
        category: category
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding area:', error);
      alert('Error adding area: ' + error.message);
    } else {
      setAreasMaster([...areasMaster, data]);
      setNewAreaName({ ...newAreaName, [category]: '' });
    }

    setIsAddingArea({ ...isAddingArea, [category]: false });
  };

  const startEditingArea = (areaId: string, currentAreaName: string) => {
    setEditingAreaId(areaId);
    setEditingAreaName({ ...editingAreaName, [areaId]: currentAreaName });
  };

  const cancelEditingArea = (areaId: string) => {
    setEditingAreaId(null);
    const newEditingAreaName = { ...editingAreaName };
    delete newEditingAreaName[areaId];
    setEditingAreaName(newEditingAreaName);
  };

  const updateArea = async (areaId: string, oldAreaName: string) => {
    const newAreaName = editingAreaName[areaId]?.trim();
    if (!newAreaName) {
      alert('Area name cannot be empty');
      return;
    }

    if (newAreaName === oldAreaName) {
      cancelEditingArea(areaId);
      return;
    }

    setIsUpdatingArea({ ...isUpdatingArea, [areaId]: true });
    const supabase = createClient();

    try {
      // Update areas_master
      const { error: masterError } = await supabase
        .from('areas_master')
        .update({ area: newAreaName })
        .eq('id', areaId);

      if (masterError) {
        console.error('Error updating area in areas_master:', masterError);
        alert('Error updating area: ' + masterError.message);
        setIsUpdatingArea({ ...isUpdatingArea, [areaId]: false });
        return;
      }

      // Update all occurrences in company_areas
      const { error: companyAreasError } = await supabase
        .from('company_areas')
        .update({ area: newAreaName })
        .eq('area', oldAreaName);

      if (companyAreasError) {
        console.error('Error updating area in company_areas:', companyAreasError);
        alert('Error updating area in company assignments: ' + companyAreasError.message);
        setIsUpdatingArea({ ...isUpdatingArea, [areaId]: false });
        return;
      }

      // Update local state
      setAreasMaster(areasMaster.map(area => 
        area.id === areaId ? { ...area, area: newAreaName } : area
      ));
      cancelEditingArea(areaId);
    } catch (error) {
      console.error('Unexpected error updating area:', error);
      alert('An unexpected error occurred');
    }

    setIsUpdatingArea({ ...isUpdatingArea, [areaId]: false });
  };

  const openDeleteAreaModal = (areaName: string, category: string) => {
    setAreaToDelete({ area: areaName, category });
    setDeleteAreaConfirmationText('');
    setDeleteAreaModalOpen(true);
  };

  const closeDeleteAreaModal = () => {
    setDeleteAreaModalOpen(false);
    setAreaToDelete(null);
    setDeleteAreaConfirmationText('');
  };

  const removeArea = async () => {
    if (deleteAreaConfirmationText !== 'Yes, delete!') {
      return;
    }

    if (!areaToDelete) {
      return;
    }

    setIsDeletingArea({ ...isDeletingArea, [areaToDelete.area]: true });
    const supabase = createClient();

    try {
      // First, delete from company_areas
      const { error: companyAreasError } = await supabase
        .from('company_areas')
        .delete()
        .eq('area', areaToDelete.area);

      if (companyAreasError) {
        console.error('Error deleting area from company_areas:', companyAreasError);
        alert('Error deleting area from company assignments: ' + companyAreasError.message);
        setIsDeletingArea({ ...isDeletingArea, [areaToDelete.area]: false });
        return;
      }

      // Then, delete from areas_master
      const { error: masterError } = await supabase
        .from('areas_master')
        .delete()
        .eq('area', areaToDelete.area);

      if (masterError) {
        console.error('Error deleting area from areas_master:', masterError);
        alert('Error deleting area: ' + masterError.message);
        setIsDeletingArea({ ...isDeletingArea, [areaToDelete.area]: false });
        return;
      }

      // Update local state
      setAreasMaster(areasMaster.filter(area => area.area !== areaToDelete.area));
      closeDeleteAreaModal();
    } catch (error) {
      console.error('Unexpected error deleting area:', error);
      alert('An unexpected error occurred');
    }

    setIsDeletingArea({ ...isDeletingArea, [areaToDelete.area]: false });
  };

  return (
    <>
      <div className="w-full space-y-6">
        <div>
          {/* <h2 className="text-2xl font-semibold mb-6">Directory Search Criteria Management</h2> */}
          
          {isLoadingAreas ? (
            <div className="text-center py-8">
              <p>Loading areas...</p>
            </div>
          ) : (
            <div className="space-y-8">
              {Object.entries(areasByCategory).map(([category, areas]) => (
                <div key={category} className="">
                  <h3 className="text-2xl font-semibold mb-4">{category}</h3>
                  
                  {/* Add New Area Form */}
                  <div className="mb-6 p-6 bg-qreen/10 rounded-lg">
                    <label htmlFor={`new-area-${category}`} className="block mb-2">
                      <p className="font-medium">Add New Area</p>
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        id={`new-area-${category}`}
                        value={newAreaName[category] || ''}
                        onChange={(e) => setNewAreaName({ ...newAreaName, [category]: e.target.value })}
                        placeholder="Enter area name"
                        className="bg-white rounded-lg text-base w-full p-2 px-3 border border-qlack/30 focus:shadow-lg focus:outline-hidden"
                        disabled={isAddingArea[category]}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addArea(category);
                          }
                        }}
                      />
                      <button
                        onClick={() => addArea(category)}
                        disabled={isAddingArea[category] || !newAreaName[category]?.trim()}
                        className="bg-qreen text-white px-6 py-2 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-qreen/90 transition-colors whitespace-nowrap"
                      >
                        {isAddingArea[category] ? 'Adding...' : 'Add'}
                      </button>
                    </div>
                  </div>

                  {/* Existing Areas List */}
                  <div>
                    <h4 className="text-lg font-semibold mb-3">Existing Areas ({areas.length})</h4>
                    {areas.length === 0 ? (
                      <p className="text-gray-500 text-sm">No areas in this category yet.</p>
                    ) : (
                      <div className="space-y-2">
                        {areas.map((area) => {
                          const isEditing = editingAreaId === area.id;
                          const editName = editingAreaName[area.id] || area.area;
                          
                          return (
                            <div
                              key={area.id}
                              className="py-3 bg-qaupe border-b border-qreen/30 flex items-center gap-4"
                            >
                              <div className="flex-1">
                                {isEditing ? (
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="text"
                                      value={editName}
                                      onChange={(e) => setEditingAreaName({ ...editingAreaName, [area.id]: e.target.value })}
                                      className="bg-white rounded-lg text-base w-full p-2 px-3 border border-qlack/30 focus:shadow-lg focus:outline-hidden"
                                      autoFocus
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                          e.preventDefault();
                                          updateArea(area.id, area.area);
                                        } else if (e.key === 'Escape') {
                                          e.preventDefault();
                                          cancelEditingArea(area.id);
                                        }
                                      }}
                                    />
                                    <button
                                      onClick={() => updateArea(area.id, area.area)}
                                      disabled={isUpdatingArea[area.id]}
                                      className="bg-qreen text-white px-4 py-2 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-qreen/90 transition-colors text-sm"
                                    >
                                      {isUpdatingArea[area.id] ? 'Saving...' : 'Save'}
                                    </button>
                                    <button
                                      onClick={() => cancelEditingArea(area.id)}
                                      disabled={isUpdatingArea[area.id]}
                                      className="bg-gray-400 text-white px-4 py-2 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-500 transition-colors text-sm"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                ) : (
                                  <p className="text-lg text-qreen-dark">{area.area}</p>
                                )}
                              </div>
                              {!isEditing && (
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => startEditingArea(area.id, area.area)}
                                    className="bg-qreen/20 text-qreen px-4 py-2 rounded-lg font-semibold hover:bg-qreen/30 transition-colors text-sm"
                                  >
                                    Rename
                                  </button>
                                  <button
                                    onClick={() => openDeleteAreaModal(area.area, area.category)}
                                    disabled={isDeletingArea[area.area]}
                                    className="bg-qrose text-white px-4 py-2 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-red-600 transition-colors text-sm"
                                  >
                                    {isDeletingArea[area.area] ? 'Removing...' : 'Remove'}
                                  </button>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              
              {Object.keys(areasByCategory).length === 0 && (
                <div className="text-center py-8">
                  <p className="text-gray-500">No areas found. Add areas to get started.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Delete Area Confirmation Modal */}
      <Dialog open={deleteAreaModalOpen} onOpenChange={setDeleteAreaModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Area</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the area &quot;{areaToDelete?.area}&quot;? 
              This will remove it from the master list and from all company profiles that have it assigned.
              <br />
              <br />
              This action cannot be undone.
              <br />
              <br />
              Please type <strong>&quot;Yes, delete!&quot;</strong> to confirm.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Input
              type="text"
              placeholder='Type "Yes, delete!" to confirm'
              value={deleteAreaConfirmationText}
              onChange={(e) => setDeleteAreaConfirmationText(e.target.value)}
              disabled={isDeletingArea[areaToDelete?.area || '']}
              className="bg-qlack/10 rounded-lg text-[16px] md:text-xl w-full p-4 px-5 placeholder:text-qlack/30 focus:shadow-lg focus:outline-hidden transition-all border border-qlack/20"
            />
          </div>
          <DialogFooter>
            <Button
              variant="default"
              onClick={closeDeleteAreaModal}
              disabled={isDeletingArea[areaToDelete?.area || '']}
            >
              Cancel
            </Button>
            <Button
              variant="alert"
              onClick={removeArea}
              disabled={deleteAreaConfirmationText !== 'Yes, delete!' || isDeletingArea[areaToDelete?.area || '']}
              className="bg-qrose text-qaupe"
            >
              {isDeletingArea[areaToDelete?.area || ''] ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
