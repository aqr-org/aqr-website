"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import EditCompanyTab from "./EditCompanyTab";
import EditMemberTab from "./EditMemberTab";
import BoardMembersTab from "./BoardMembersTab";
import DirectorySearchCriteriaTab from "./DirectorySearchCriteriaTab";

export default function SuperadminPanel() {
  const [isMounted, setIsMounted] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteType, setDeleteType] = useState<'member' | 'company' | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  // Ensure component is mounted (client-side only) before rendering Select components
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const openDeleteModal = (type: 'member' | 'company', id: string) => {
    setDeleteType(type);
    setDeleteId(id);
    setDeleteConfirmationText('');
    setDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setDeleteModalOpen(false);
    setDeleteType(null);
    setDeleteId(null);
    setDeleteConfirmationText('');
  };

  const handleDelete = async () => {
    if (deleteConfirmationText !== 'Yes, delete!' || !deleteId) {
      return;
    }

    setIsDeleting(true);
    const supabase = createClient();

    try {
      if (deleteType === 'member') {
        const { error } = await supabase
          .from('members')
          .delete()
          .eq('id', deleteId);

        if (error) {
          console.error('Error deleting member:', error);
          alert('Error deleting member: ' + error.message);
          setIsDeleting(false);
          return;
        }

        alert('Member deleted successfully');
      } else if (deleteType === 'company') {
        const { error } = await supabase
          .from('companies')
          .delete()
          .eq('id', deleteId);

        if (error) {
          console.error('Error deleting company:', error);
          alert('Error deleting company: ' + error.message);
          setIsDeleting(false);
          return;
        }

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
          <Tab
            className="border border-qlack/20 border-b-0 font-normal bg-qlack/5 text-qreen-dark px-4 py-2 pb-1 rounded-t-lg cursor-pointer hover:pb-2 transition-all"
            selectedClassName="!text-qlack !font-bold relative !pb-2 top-[1px] bg-qaupe"
          >
            Directory Search Criteria
          </Tab>
        </TabList>

        <TabPanel 
          selectedClassName="border border-qlack/20 md:rounded-b-lg md:rounded-tr-lg p-8 w-full bg-qaupe"
        >
          <EditCompanyTab 
            isMounted={isMounted} 
            onDeleteCompany={(id) => openDeleteModal('company', id)}
          />
        </TabPanel>

        <TabPanel 
          selectedClassName="border border-qlack/20 md:rounded-b-lg md:rounded-tr-lg p-8 w-full bg-qaupe"
        >
          <EditMemberTab 
            isMounted={isMounted} 
            onDeleteMember={(id) => openDeleteModal('member', id)}
          />
        </TabPanel>

        <TabPanel 
          selectedClassName="border border-qlack/20 md:rounded-b-lg md:rounded-tr-lg p-8 w-full bg-qaupe"
        >
          <BoardMembersTab isMounted={isMounted} />
        </TabPanel>

        <TabPanel 
          selectedClassName="border border-qlack/20 md:rounded-b-lg md:rounded-tr-lg p-8 w-full bg-qaupe"
        >
          <DirectorySearchCriteriaTab />
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
