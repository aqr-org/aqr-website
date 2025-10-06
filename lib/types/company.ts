export interface CompanyAdminInfo {
  id?: string;
  company_id?: string;
  adminemail?: string;
  created_at?: string;
  // Add other fields as needed
}
export interface Company {
  id: string;
  name: string;
  type?: string;
  companysize?: string;
  established?: string;
  gradprog?: string;
  logo?: string;
  narrative?: string;
  prsaward: string;
  accred: string;
  proforgs: string;
  // Add other company fields
}

// Type used in forms - matches CompanyInfoUpdateForm requirements
export interface CompanyData {
  id: string;
  name: string;
  type: string;
  established: number;
  companysize: string;
  narrative: string;
  gradprog: string;
  proforgs: string;
  prsaward: string;
  accred: string;
  logo: string;
}
export interface CompanyArea {
  id: string;
  company_id: string;
  area: string;
}

export interface CompanyAreaData {
  id: string;  // Changed from number to string to match CompanyArea
  company_id: string;  // Changed from number to string
  companyId: string;  // Changed from number to string
  area: string;
}

export interface CompanyContactInfo {
  id: string;
  company_id: string;
  addr1?: string;
  addr2?: string;
  postcode?: string;
  country?: string;
  website?: string;
  phone?: string;
  // Add other contact fields
}

export interface Member {
  id: string;
  email: string;
  firstname?: string;
  lastname?: string;
  jobtitle?: string;
  organisation?: string;
  country?: string;
  companyassociation?: string;
  bio?: string;
  timeline?: string[]; // JSON field
  created_at?: string;
  updated_at?: string;
}

export interface CompanyContactData {
  id: string;
  company_id: string;
  addr1: string | null;
  addr2: string | null;
  addr3: string | null;
  addr4: string | null;
  addr5: string | null;
  postcode: string | null;
  country: string | null;
  phone: string | null;
  email: string | null;
  mobile: string | null;
  website: string | null;
  linkedin: string | null;
  facebook: string | null;
  twitter: string | null;
  youtube: string | null;
  mapref: string | null;
}

export interface CompanyContactUpdateFormProps {
  companyId: string;
  contactData: CompanyContactData | null;
}

export interface CompanyAreaUpdateFormProps {
  companyId: string;
  companyAreas: CompanyAreaData[];
}