"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import CompanyUpdateForm from "@/components/member-settings/CompanyUpdateForm";
import MemberUpdateForm from "@/components/member-settings/MemberUpdateForm";
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import Select from 'react-select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertTriangle } from "lucide-react";
import { UserBeaconData } from "@/lib/types";

interface Company {
  id: string;
  name: string;
}

// Helper function to extract membership tier from allMemberships
function getMembershipTier(allMemberships?: string[]): string | null {
  if (!allMemberships || allMemberships.length === 0) {
    return null;
  }

  if (allMemberships.some(m => m.includes("Business Directory Enhanced"))) {
    return "Enhanced";
  } else if (allMemberships.some(m => m.includes("Business Directory Standard"))) {
    return "Standard";
  } else if (allMemberships.some(m => m.includes("Business Directory Basic"))) {
    return "Basic";
  }

  return null;
}

interface Member {
  id: string;
  firstname: string;
  lastname: string;
  email: string;
}

interface BoardMember {
  id: string;
  member_id: string;
  member_name: string;
  position: string;
}

export default function SuperadminPanel() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [companyData, setCompanyData] = useState<any>(null);
  const [companyAreas, setCompanyAreas] = useState<any[]>([]);
  const [companyContactInfo, setCompanyContactInfo] = useState<any | null>(null);
  const [memberData, setMemberData] = useState<any>(null);
  const [companyBeaconData, setCompanyBeaconData] = useState<UserBeaconData | null>(null);
  const [isLoadingCompanies, setIsLoadingCompanies] = useState(true);
  const [isLoadingMembers, setIsLoadingMembers] = useState(true);
  const [isLoadingCompanyData, setIsLoadingCompanyData] = useState(false);
  const [isLoadingMemberData, setIsLoadingMemberData] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [boardMembers, setBoardMembers] = useState<BoardMember[]>([]);
  const [isLoadingBoardMembers, setIsLoadingBoardMembers] = useState(false);
  const [newBoardMemberId, setNewBoardMemberId] = useState<string | null>(null);
  const [newBoardMemberPosition, setNewBoardMemberPosition] = useState<string>('');
  const [editingPositions, setEditingPositions] = useState<Record<string, string>>({});
  const [isAdding, setIsAdding] = useState(false);
  const [isUpdating, setIsUpdating] = useState<Record<string, boolean>>({});
  const [isRemoving, setIsRemoving] = useState<Record<string, boolean>>({});
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteType, setDeleteType] = useState<'member' | 'company' | null>(null);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  // Ensure component is mounted (client-side only) before rendering Select components
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Fetch all companies
  useEffect(() => {
    const fetchCompanies = async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('companies')
        .select('id, name')
        .order('name');

      if (error) {
        console.error('Error fetching companies:', error);
      } else {
        setCompanies(data || []);
      }
      setIsLoadingCompanies(false);
    };

    fetchCompanies();
  }, []);

  // Fetch all members
  useEffect(() => {
    const fetchMembers = async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('members')
        .select('id, firstname, lastname, email')
        .order('firstname, lastname');

      if (error) {
        console.error('Error fetching members:', error);
      } else {
        setMembers(data || []);
      }
      setIsLoadingMembers(false);
    };

    fetchMembers();
  }, []);

  // Fetch board members
  useEffect(() => {
    const fetchBoardMembers = async () => {
      setIsLoadingBoardMembers(true);
      const supabase = createClient();
      const { data, error } = await supabase
        .from('board_members')
        .select('id, member_id, member_name, position')
        .order('created_at');

      if (error) {
        console.error('Error fetching board members:', error);
      } else {
        setBoardMembers(data || []);
      }
      setIsLoadingBoardMembers(false);
    };

    fetchBoardMembers();
  }, []);

  // Fetch company data when selected
  useEffect(() => {
    const fetchCompanyData = async () => {
      if (!selectedCompanyId) {
        setCompanyData(null);
        setCompanyAreas([]);
        setCompanyContactInfo(null);
        setCompanyBeaconData(null);
        return;
      }

      setIsLoadingCompanyData(true);
      const supabase = createClient();

      try {
        const { data: companyWithRelations, error } = await supabase
          .from("companies")
          .select(`
            *,
            company_areas(id, company_id, area),
            company_contact_info(*)
          `)
          .eq("id", selectedCompanyId)
          .maybeSingle();

        if (error) {
          console.error("Error fetching company data:", error);
          setCompanyData(null);
          setCompanyAreas([]);
          setCompanyContactInfo(null);
          setCompanyBeaconData(null);
        } else {
          setCompanyData(companyWithRelations);
          setCompanyAreas(companyWithRelations?.company_areas || []);
          setCompanyContactInfo(companyWithRelations?.company_contact_info || null);
          
          // Fetch beacon data for the company by beacon_membership_id or organization name
          if (companyWithRelations?.name || companyWithRelations?.beacon_membership_id) {
            try {
              const response = await fetch('/api/beacon/company-membership', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                  companyName: companyWithRelations.name,
                  beaconMembershipId: companyWithRelations.beacon_membership_id
                }),
              }).catch((fetchError) => {
                console.error("Fetch error (network/CORS):", fetchError);
                throw fetchError;
              });
              
              if (response.ok) {
                const membershipData = await response.json();
                
                if (membershipData.found && membershipData.allMemberships && membershipData.allMemberships.length > 0) {
                  // Create a UserBeaconData-like object with just the membership info
                  const finalBeaconData: UserBeaconData = {
                    allMemberships: membershipData.allMemberships,
                    // Add minimal required fields
                    id: '',
                    personId: '',
                    firstname: '',
                    lastname: '',
                    email: '',
                    hasCurrentMembership: true,
                    hasOrg: true,
                    organizations: [{ id: '', name: companyWithRelations.name }]
                  };
                  
                  setCompanyBeaconData(finalBeaconData);
                } else {
                  setCompanyBeaconData(null);
                }
              } else {
                const errorText = await response.text().catch(() => 'Could not read error response');
                console.error("Failed to fetch company membership, status:", response.status, "Error:", errorText);
                setCompanyBeaconData(null);
              }
            } catch (error) {
              console.error("Error fetching company membership:", error);
              setCompanyBeaconData(null);
            }
          } else {
            setCompanyBeaconData(null);
          }
        }
      } catch (error) {
        console.error("Unexpected error fetching company data:", error);
        setCompanyData(null);
        setCompanyAreas([]);
        setCompanyContactInfo(null);
        setCompanyBeaconData(null);
      }

      setIsLoadingCompanyData(false);
    };

    fetchCompanyData();
  }, [selectedCompanyId]);

  // Fetch member data when selected
  useEffect(() => {
    const fetchMemberData = async () => {
      if (!selectedMemberId) {
        setMemberData(null);
        return;
      }

      setIsLoadingMemberData(true);
      const supabase = createClient();

      try {
        const { data, error } = await supabase
          .from("members")
          .select("*")
          .eq("id", selectedMemberId)
          .maybeSingle();

        if (error) {
          console.error("Error fetching member data:", error);
          setMemberData(null);
        } else {
          setMemberData(data);
        }
      } catch (error) {
        console.error("Unexpected error fetching member data:", error);
        setMemberData(null);
      }

      setIsLoadingMemberData(false);
    };

    fetchMemberData();
  }, [selectedMemberId]);

  const companyOptions = companies.map(company => ({
    value: company.id,
    label: company.name
  }));

  const memberOptions = members.map(member => ({
    value: member.id,
    label: `${member.firstname} ${member.lastname}${member.email ? ` (${member.email})` : ''}`
  }));

  // Filter out members who are already board members
  const availableMemberOptions = memberOptions.filter(option => 
    !boardMembers.some(bm => bm.member_id === option.value)
  );

  // Board members CRUD functions
  const addBoardMember = async () => {
    if (!newBoardMemberId || !newBoardMemberPosition.trim()) {
      alert('Please select a member and enter a position');
      return;
    }

    const selectedMember = members.find(m => m.id === newBoardMemberId);
    if (!selectedMember) {
      alert('Selected member not found');
      return;
    }

    const memberName = `${selectedMember.firstname} ${selectedMember.lastname}`;
    setIsAdding(true);

    const supabase = createClient();
    const { data, error } = await supabase
      .from('board_members')
      .insert({
        member_id: newBoardMemberId,
        member_name: memberName,
        position: newBoardMemberPosition.trim()
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding board member:', error);
      alert('Error adding board member: ' + error.message);
    } else {
      setBoardMembers([...boardMembers, data]);
      setNewBoardMemberId(null);
      setNewBoardMemberPosition('');
    }

    setIsAdding(false);
  };

  const updateBoardMember = async (boardMemberId: string) => {
    const newPosition = editingPositions[boardMemberId];
    if (!newPosition || !newPosition.trim()) {
      alert('Position cannot be empty');
      return;
    }

    setIsUpdating({ ...isUpdating, [boardMemberId]: true });

    const supabase = createClient();
    const { error } = await supabase
      .from('board_members')
      .update({ position: newPosition.trim() })
      .eq('id', boardMemberId);

    if (error) {
      console.error('Error updating board member:', error);
      alert('Error updating board member: ' + error.message);
    } else {
      setBoardMembers(boardMembers.map(bm => 
        bm.id === boardMemberId ? { ...bm, position: newPosition.trim() } : bm
      ));
      const newEditingPositions = { ...editingPositions };
      delete newEditingPositions[boardMemberId];
      setEditingPositions(newEditingPositions);
    }

    setIsUpdating({ ...isUpdating, [boardMemberId]: false });
  };

  const removeBoardMember = async (boardMemberId: string) => {
    if (!confirm('Are you sure you want to remove this board member?')) {
      return;
    }

    setIsRemoving({ ...isRemoving, [boardMemberId]: true });

    const supabase = createClient();
    const { error } = await supabase
      .from('board_members')
      .delete()
      .eq('id', boardMemberId);

    if (error) {
      console.error('Error removing board member:', error);
      alert('Error removing board member: ' + error.message);
    } else {
      setBoardMembers(boardMembers.filter(bm => bm.id !== boardMemberId));
    }

    setIsRemoving({ ...isRemoving, [boardMemberId]: false });
  };

  const startEditingPosition = (boardMemberId: string, currentPosition: string) => {
    setEditingPositions({ ...editingPositions, [boardMemberId]: currentPosition });
  };

  const cancelEditingPosition = (boardMemberId: string) => {
    const newEditingPositions = { ...editingPositions };
    delete newEditingPositions[boardMemberId];
    setEditingPositions(newEditingPositions);
  };

  const openDeleteModal = (type: 'member' | 'company') => {
    setDeleteType(type);
    setDeleteConfirmationText('');
    setDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setDeleteModalOpen(false);
    setDeleteType(null);
    setDeleteConfirmationText('');
  };

  const handleDelete = async () => {
    if (deleteConfirmationText !== 'Yes, delete!') {
      return;
    }

    setIsDeleting(true);
    const supabase = createClient();

    try {
      if (deleteType === 'member' && selectedMemberId) {
        const { error } = await supabase
          .from('members')
          .delete()
          .eq('id', selectedMemberId);

        if (error) {
          console.error('Error deleting member:', error);
          alert('Error deleting member: ' + error.message);
          setIsDeleting(false);
          return;
        }

        // Remove from local state
        setMembers(members.filter(m => m.id !== selectedMemberId));
        setSelectedMemberId(null);
        setMemberData(null);
        alert('Member deleted successfully');
      } else if (deleteType === 'company' && selectedCompanyId) {
        const { error } = await supabase
          .from('companies')
          .delete()
          .eq('id', selectedCompanyId);

        if (error) {
          console.error('Error deleting company:', error);
          alert('Error deleting company: ' + error.message);
          setIsDeleting(false);
          return;
        }

        // Remove from local state
        setCompanies(companies.filter(c => c.id !== selectedCompanyId));
        setSelectedCompanyId(null);
        setCompanyData(null);
        setCompanyAreas([]);
        setCompanyContactInfo(null);
        alert('Company deleted successfully');
      }
    } catch (error) {
      console.error('Unexpected error during deletion:', error);
      alert('An unexpected error occurred');
    }

    setIsDeleting(false);
    closeDeleteModal();
  };

  return (
    <div className="w-full">
      <Tabs>
        <TabList 
          className="flex gap-1 items-end mb-0"
        >
          <Tab
            className="border border-qlack/20 border-b-0 font-normal bg-qlack/5 text-qreen-dark px-4 py-2 pb-1 rounded-t-lg cursor-pointer hover:pb-2 transition-all"
            selectedClassName="!text-qlack !font-bold relative !pb-2 top-[1px] bg-qaupe"
          >
            Edit Company
          </Tab>
          <Tab
            className="border border-qlack/20 border-b-0 font-normal bg-qlack/5 text-qreen-dark px-4 py-2 pb-1 rounded-t-lg cursor-pointer hover:pb-2 transition-all"
            selectedClassName="!text-qlack !font-bold relative !pb-2 top-[1px] bg-qaupe"
          >
            Edit Member
          </Tab>
          <Tab
            className="border border-qlack/20 border-b-0 font-normal bg-qlack/5 text-qreen-dark px-4 py-2 pb-1 rounded-t-lg cursor-pointer hover:pb-2 transition-all"
            selectedClassName="!text-qlack !font-bold relative !pb-2 top-[1px] bg-qaupe"
          >
            Board Members
          </Tab>
        </TabList>

        <TabPanel 
          selectedClassName="border border-qlack/20 md:rounded-b-lg md:rounded-tr-lg p-8 w-full bg-qaupe"
        >
          <div className="w-full space-y-6">
            <div>
              <label htmlFor="company-select" className="block mb-2">
                <p>Select Company</p>
              </label>
              {isMounted ? (
                <Select
                  unstyled
                  instanceId="company-select"
                  classNames={{
                    control: () => 
                      "bg-white/80 border border-qreen/30 rounded-lg text-base text-qreen-dark md:text-xl disabled:opacity-50 disabled:cursor-not-allowed w-full p-4 px-5 placeholder:text-qlack/30 focus:shadow-lg focus:outline-hidden transition-all",
                    menu: () => 
                      "bg-white  border border-qreen/30 rounded-lg text-base text-qreen-dark md:text-xl disabled:opacity-50 disabled:cursor-not-allowed w-full p-4 px-5 placeholder:text-qlack/30 focus:shadow-lg focus:outline-hidden transition-all",
                    placeholder: () => 
                      "text-qlack/30",
                    
                  }}
                  id="company-select"
                  options={companyOptions}
                  isSearchable={true}
                  isClearable={true}
                  value={companyOptions.find(opt => opt.value === selectedCompanyId) || null}
                  onChange={(option) => setSelectedCompanyId(option ? (option as { value: string; label: string }).value : null)}
                  placeholder="-- Select a company --"
                  isDisabled={isLoadingCompanies}
                  isLoading={isLoadingCompanies}
                />
              ) : (
                <div className="bg-qlack/10 rounded-lg text-[16px] md:text-xl w-full p-4 px-5 text-qlack/30">
                  -- Select a company --
                </div>
              )}
            </div>

            {isLoadingCompanyData && (
              <div className="text-center py-8">
                <p>Loading company data...</p>
              </div>
            )}

            {!isLoadingCompanyData && selectedCompanyId && companyData && (
              <>
                {/* Display company name, membership tier, and status */}
                <div className="mb-6">
                  <h2 className="text-2xl md:text-3xl font-semibold text-qreen-dark mb-2">
                    {companyData.name}
                  </h2>
                  {(companyBeaconData || companyData.beacon_membership_status) && (
                    <div className="flex gap-4 items-center text-sm text-qlack/70">
                      {companyBeaconData && (
                        <>
                          {getMembershipTier(companyBeaconData.allMemberships) && (
                            <span>
                              <strong>Membership Tier:</strong> {getMembershipTier(companyBeaconData.allMemberships)}
                            </span>
                          )}
                        </>
                      )}
                      {companyData.beacon_membership_status && (
                        <span>
                          <strong>Status:</strong> {companyData.beacon_membership_status}
                        </span>
                      )}
                    </div>
                  )}
                </div>
                <div className="mb-4">
                  <Button
                    variant="alert"
                    onClick={() => openDeleteModal('company')}
                    className="w-full sm:w-auto bg-qrose text-qaupe text-sm"
                  >
                    <AlertTriangle className="w-4 h-4" />
                    Delete Company
                  </Button>
                </div>
                <CompanyUpdateForm 
                  companyData={companyData}
                  companyAreas={companyAreas}
                  contactData={companyContactInfo}
                  isSuperAdmin={true}
                  userBeaconData={companyBeaconData || undefined}
                />
              </>
            )}

            {!isLoadingCompanyData && selectedCompanyId && !companyData && (
              <div className="text-center py-8">
                <p className="text-red-600">Company not found or error loading data.</p>
              </div>
            )}

            {!selectedCompanyId && (
              <div className="text-center py-8">
                <p className="text-gray-500">Select a company from the dropdown above to edit.</p>
              </div>
            )}
          </div>
        </TabPanel>

        <TabPanel 
          selectedClassName="border border-qlack/20 md:rounded-b-lg md:rounded-tr-lg p-8 w-full bg-qaupe"
        >
          <div className="w-full space-y-6">
            <div>
              <label htmlFor="member-select" className="block mb-2">
                <p>Select Member</p>
              </label>
              {isMounted ? (
                <Select
                  unstyled
                  instanceId="member-select"
                  classNames={{
                    control: () => 
                      "bg-qlack/10 rounded-lg text-[16px] md:text-xl disabled:opacity-50 disabled:cursor-not-allowed w-full p-4 px-5 placeholder:text-qlack/30 focus:shadow-lg focus:outline-hidden transition-all",
                    menu: () => 
                      "bg-qaupe border-2 border-qlack/20 rounded-lg text-[16px] md:text-xl disabled:opacity-50 disabled:cursor-not-allowed w-full p-4 px-5 placeholder:text-qlack/30 focus:shadow-lg focus:outline-hidden transition-all",
                    placeholder: () => 
                      "text-qlack/30",
                  }}
                  id="member-select"
                  options={memberOptions}
                  isSearchable={true}
                  isClearable={true}
                  value={memberOptions.find(opt => opt.value === selectedMemberId) || null}
                  onChange={(option) => setSelectedMemberId(option ? (option as { value: string; label: string }).value : null)}
                  placeholder="-- Select a member --"
                  isDisabled={isLoadingMembers}
                  isLoading={isLoadingMembers}
                />
              ) : (
                <div className="bg-qlack/10 rounded-lg text-[16px] md:text-xl w-full p-4 px-5 text-qlack/30">
                  -- Select a member --
                </div>
              )}
            </div>

            {isLoadingMemberData && (
              <div className="text-center py-8">
                <p>Loading member data...</p>
              </div>
            )}

            {!isLoadingMemberData && selectedMemberId && memberData && (
              <>
                <div className="mb-4">
                  <Button
                    variant="alert"
                    onClick={() => openDeleteModal('member')}
                    className="w-full sm:w-auto bg-qrose text-qaupe text-sm"
                  >
                   <AlertTriangle className="w-4 h-4" /> Delete Member
                  </Button>
                </div>
                <MemberUpdateForm 
                  memberData={memberData}
                  isSuperAdmin={true}
                />
              </>
            )}

            {!isLoadingMemberData && selectedMemberId && !memberData && (
              <div className="text-center py-8">
                <p className="text-red-600">Member not found or error loading data.</p>
              </div>
            )}

            {!selectedMemberId && (
              <div className="text-center py-8">
                <p className="text-gray-500">Select a member from the dropdown above to edit.</p>
              </div>
            )}
          </div>
        </TabPanel>

        <TabPanel 
          selectedClassName="border border-qlack/20 md:rounded-b-lg md:rounded-tr-lg p-8 w-full bg-qaupe"
        >
          <div className="w-full space-y-6">
            <div>
              <h2 className="text-2xl font-semibold mb-6">Board Members Management</h2>
              
              {/* Add New Board Member Form */}
              <div className="mb-8 p-4 bg-white/50 rounded-lg border border-qlack/20">
                <h3 className="text-xl font-semibold mb-4">Add New Board Member</h3>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="new-board-member-select" className="block mb-2">
                      <p>Select Member</p>
                    </label>
                    {isMounted ? (
                      <Select
                        unstyled
                        instanceId="new-board-member-select"
                        classNames={{
                          control: () => 
                            "bg-qlack/10 rounded-lg text-[16px] md:text-xl disabled:opacity-50 disabled:cursor-not-allowed w-full p-4 px-5 placeholder:text-qlack/30 focus:shadow-lg focus:outline-hidden transition-all",
                          menu: () => 
                            "bg-qaupe border-2 border-qlack/20 rounded-lg text-[16px] md:text-xl disabled:opacity-50 disabled:cursor-not-allowed w-full p-4 px-5 placeholder:text-qlack/30 focus:shadow-lg focus:outline-hidden transition-all",
                          placeholder: () => 
                            "text-qlack/30",
                        }}
                        id="new-board-member-select"
                        options={availableMemberOptions}
                        isSearchable={true}
                        isClearable={true}
                        value={availableMemberOptions.find(opt => opt.value === newBoardMemberId) || null}
                        onChange={(option) => setNewBoardMemberId(option ? (option as { value: string; label: string }).value : null)}
                        placeholder="-- Select a member --"
                        isDisabled={isLoadingMembers || isAdding}
                        isLoading={isLoadingMembers}
                      />
                    ) : (
                      <div className="bg-qlack/10 rounded-lg text-[16px] md:text-xl w-full p-4 px-5 text-qlack/30">
                        -- Select a member --
                      </div>
                    )}
                  </div>
                  <div>
                    <label htmlFor="board-member-position" className="block mb-2">
                      <p>Position</p>
                    </label>
                    <input
                      type="text"
                      id="board-member-position"
                      value={newBoardMemberPosition}
                      onChange={(e) => setNewBoardMemberPosition(e.target.value)}
                      placeholder="e.g., President, Vice President, Treasurer"
                      className="bg-qlack/10 rounded-lg text-[16px] md:text-xl w-full p-4 px-5 placeholder:text-qlack/30 focus:shadow-lg focus:outline-hidden transition-all border border-qlack/20"
                      disabled={isAdding}
                    />
                  </div>
                  <button
                    onClick={addBoardMember}
                    disabled={isAdding || !newBoardMemberId || !newBoardMemberPosition.trim()}
                    className="bg-qreen text-white px-6 py-2 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-qreen/90 transition-colors"
                  >
                    {isAdding ? 'Adding...' : 'Add Board Member'}
                  </button>
                </div>
              </div>

              {/* Existing Board Members List */}
              <div>
                <h3 className="text-xl font-semibold mb-4">Current Board Members</h3>
                {isLoadingBoardMembers ? (
                  <div className="text-center py-8">
                    <p>Loading board members...</p>
                  </div>
                ) : boardMembers.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No board members added yet.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {boardMembers.map((boardMember) => {
                      const isEditing = editingPositions.hasOwnProperty(boardMember.id);
                      const editPosition = editingPositions[boardMember.id] || boardMember.position;
                      
                      return (
                        <div
                          key={boardMember.id}
                          className="p-4 bg-white/50 rounded-lg border border-qlack/20 flex items-center gap-4"
                        >
                          <div className="flex-1">
                            <p className="font-semibold text-lg">{boardMember.member_name}</p>
                            {isEditing ? (
                              <div className="mt-2 flex items-center gap-2">
                                <input
                                  type="text"
                                  value={editPosition}
                                  onChange={(e) => setEditingPositions({ ...editingPositions, [boardMember.id]: e.target.value })}
                                  className="bg-white rounded-lg text-base w-full p-2 px-3 border border-qlack/30 focus:shadow-lg focus:outline-hidden"
                                  autoFocus
                                />
                                <button
                                  onClick={() => updateBoardMember(boardMember.id)}
                                  disabled={isUpdating[boardMember.id]}
                                  className="bg-qreen text-white px-4 py-2 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-qreen/90 transition-colors text-sm"
                                >
                                  {isUpdating[boardMember.id] ? 'Saving...' : 'Save'}
                                </button>
                                <button
                                  onClick={() => cancelEditingPosition(boardMember.id)}
                                  disabled={isUpdating[boardMember.id]}
                                  className="bg-gray-400 text-white px-4 py-2 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-500 transition-colors text-sm"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <p className="text-gray-700 mt-1">{boardMember.position}</p>
                            )}
                          </div>
                          {!isEditing && (
                            <div className="flex gap-2">
                              <button
                                onClick={() => startEditingPosition(boardMember.id, boardMember.position)}
                                className="bg-qreen/20 text-qreen px-4 py-2 rounded-lg font-semibold hover:bg-qreen/30 transition-colors text-sm"
                              >
                                Edit Position
                              </button>
                              <button
                                onClick={() => removeBoardMember(boardMember.id)}
                                disabled={isRemoving[boardMember.id]}
                                className="bg-qrose text-white px-4 py-2 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-red-600 transition-colors text-sm"
                              >
                                {isRemoving[boardMember.id] ? 'Removing...' : 'Remove'}
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
          </div>
        </TabPanel>
      </Tabs>

      {/* Delete Confirmation Modal */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {deleteType === 'member' ? 'Delete Member' : 'Delete Company'}
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this {deleteType}? This action cannot be undone.
              <br />
              <br />
              Please type <strong>&quot;Yes, delete!&quot;</strong> to confirm.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Input
              type="text"
              placeholder='Type "Yes, delete!" to confirm'
              value={deleteConfirmationText}
              onChange={(e) => setDeleteConfirmationText(e.target.value)}
              disabled={isDeleting}
              className="bg-qlack/10 rounded-lg text-[16px] md:text-xl w-full p-4 px-5 placeholder:text-qlack/30 focus:shadow-lg focus:outline-hidden transition-all border border-qlack/20"
            />
          </div>
          <DialogFooter>
            <Button
              variant="default"
              onClick={closeDeleteModal}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="alert"
              onClick={handleDelete}
              disabled={deleteConfirmationText !== 'Yes, delete!' || isDeleting}
              className="bg-qrose text-qaupe"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

