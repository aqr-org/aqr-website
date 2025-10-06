// Re-export all types for easy importing
// Using 'export type' syntax for isolatedModules compatibility

// Beacon API types
export type {
  UserBeaconData,
  BeaconPersonEntity,
  BeaconPersonResult,
  BeaconMembershipEntity,
  BeaconMembershipReferencePersonEntity,
  BeaconMembershipReferenceCompanyEntity,
  BeaconMembershipResult,
  BeaconOrgEntity,
  BeaconOrgReferenceEntity,
  BeaconOrgResult,
  BeaconApiResponse
} from './beacon';

// Company and related types
export type {
  CompanyAdminInfo,
  Company,
  CompanyData,
  CompanyArea,
  CompanyContactInfo,
  CompanyContactData,
  CompanyContactUpdateFormProps,
  CompanyAreaData,
  Member
} from './company';

// Common types (when they exist)
// export type {} from './common';

// Member-specific types (when they exist)
// export type {} from './member';