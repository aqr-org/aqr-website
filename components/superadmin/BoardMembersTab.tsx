"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import Select from 'react-select';

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

interface BoardMembersTabProps {
  isMounted: boolean;
}

export default function BoardMembersTab({ isMounted }: BoardMembersTabProps) {
  const [members, setMembers] = useState<Member[]>([]);
  const [boardMembers, setBoardMembers] = useState<BoardMember[]>([]);
  const [isLoadingMembers, setIsLoadingMembers] = useState(true);
  const [isLoadingBoardMembers, setIsLoadingBoardMembers] = useState(false);
  const [newBoardMemberId, setNewBoardMemberId] = useState<string | null>(null);
  const [newBoardMemberPosition, setNewBoardMemberPosition] = useState<string>('');
  const [editingPositions, setEditingPositions] = useState<Record<string, string>>({});
  const [isAdding, setIsAdding] = useState(false);
  const [isUpdating, setIsUpdating] = useState<Record<string, boolean>>({});
  const [isRemoving, setIsRemoving] = useState<Record<string, boolean>>({});

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

  return (
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
  );
}
