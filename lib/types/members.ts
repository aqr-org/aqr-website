import type { ReactNode } from 'react';
import type { UserBeaconData as BeaconUserBeaconData } from './beacon';

// Reuse the canonical UserBeaconData type from the beacon types
export type UserBeaconData = BeaconUserBeaconData;

export interface MemberFormData {
  firstname: string;
  lastname: string;
  jobtitle: string;
  organisation: string;
  country: string;
  maintag: string;
  othertags: string[];
  linkedin: string;
  flags: string[];
  cttetitle: string;
  ctteareas: string;
  biognotes: string;
  joined: string;
  timeline: string[];
  beacon_id?: string;
  beacon_membership?: string;
  beacon_membership_status?: string;
}

export interface MemberFormFieldsProps {
  formValues: MemberFormData;
  onFormChange: (values: MemberFormData) => void;
  onSubmit: (biognotes: string) => Promise<void>;
  initialBio?: string;
  submitButtonText: string;
  isLoading: boolean;
  wasSuccessful: boolean;
  successIcon?: ReactNode;
  isCreateMode?: boolean;
  userBeaconData?: UserBeaconData;
  memberId?: string;
  currentPortrait?: string;
  onPortraitUploaded?: (url: string) => void;
}

export type { MemberFormData as MemberFormDataType };

// Props for the MemberCreateForm component
export interface MemberCreateFormProps {
  userBeaconData: UserBeaconData;
}
