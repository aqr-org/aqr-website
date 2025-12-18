"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import MemberUpdateForm from "@/components/member-settings/MemberUpdateForm";
import Select from 'react-select';
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

interface Member {
  id: string;
  firstname: string;
  lastname: string;
  email: string;
}

interface EditMemberTabProps {
  isMounted: boolean;
  onDeleteMember: (memberId: string) => void;
}

export default function EditMemberTab({ isMounted, onDeleteMember }: EditMemberTabProps) {
  const [members, setMembers] = useState<Member[]>([]);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [memberData, setMemberData] = useState<any>(null);
  const [isLoadingMembers, setIsLoadingMembers] = useState(true);
  const [isLoadingMemberData, setIsLoadingMemberData] = useState(false);

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

  const memberOptions = members.map(member => ({
    value: member.id,
    label: `${member.firstname} ${member.lastname}${member.email ? ` (${member.email})` : ''}`
  }));

  return (
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
              onClick={() => selectedMemberId && onDeleteMember(selectedMemberId)}
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
  );
}
