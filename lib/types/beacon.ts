export interface UserBeaconData {
  id: string;
  email: string;
  hasCurrentMembership: boolean;
  hasOrg: boolean;
  allMemberships?: string[];
  organizations: { id: string; name: string }[];
  personName?: string;
}
export interface BeaconMembershipEntity {
    id: string;
    member: string[];
    additional_members: string[];
    type: string[];
    status: string[];
}
export interface BeaconMembershipReferencePersonEntity {
    id: string;
    name: {
      full: string;
      first: string;
      last: string;
    }
    type: string[];
    entity_type_id: number;
    emails: { 
      email: string; 
      is_primary: boolean 
    }[];
}
export interface BeaconMembershipReferenceCompanyEntity {
    id: string;
    name: string;
    type: string[];
    entity_type_id: number;
    emails: { 
      email: string; 
      is_primary: boolean 
    }[];
    primary_contact?: BeaconPersonEntity[];
}
export interface BeaconMembershipResult {
    entity: BeaconMembershipEntity;
    references: {
      entity: BeaconMembershipReferencePersonEntity | BeaconMembershipReferenceCompanyEntity
    }[];
}
export interface BeaconPersonEntity {
  id: string;
  created_at: string;
  updated_at: string;
  name: {
    full: string;
    first: string;
    last: string;
    middle?: string;
    prefix?: string;
  };
  emails: Array<{
    email: string;
    is_primary: boolean;
  }>;
  type: string[];
  title?: string;
  notes?: string;
  // Add other fields as needed
}
export interface BeaconPersonResult {
  entity: BeaconPersonEntity;
}
export interface BeaconOrgEntity {
  id: string;
  name: string;
  emails: Array<{
    email: string;
    is_primary: boolean;
  }>;
  primary_contact?: BeaconPersonEntity[];
}
export interface BeaconOrgReferenceEntity {
  id: string;
  organization: string[];
  name: {
    full: string;
    first: string;
    last: string;
  };
  type: string[];
  emails: {
    email: string;
    is_primary: boolean;
  }[];
}
export interface BeaconOrgResult {
  entity: BeaconOrgEntity;
  references: {
    entity: BeaconOrgReferenceEntity
  }[];
}
export interface BeaconApiResponse {
  results: BeaconPersonResult[] | BeaconMembershipResult[] | BeaconOrgResult[];
}