import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// This check can be removed, it is just for tutorial purposes
export const hasEnvVars =
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY;

export const profOrgsNameMap: {[key: string]: string} = {
  "MRS": "The Market Research Society",
  "ESOMAR": "The European Society for Opinion and Marketing Research",
  "ICG": "The Independent Consultants Group",
  "QRCA": "The Qualitative Research Consultants Association",
  "APG": "The Account Planning Group",
  "SRA": "The Social Research Association",
  "IQCS": "The Interviewer Quality Control Scheme",
  "VFA": "The Viewing Facilities Association",
  "AIMRI": "The Alliance of International Market Research Institutes"
};

export const getProfessionalOrgName = (abbreviation: string): string => {
  return profOrgsNameMap[abbreviation as keyof typeof profOrgsNameMap] || abbreviation;
};
