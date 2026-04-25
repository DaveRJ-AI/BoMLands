import type { ChronologyPeriod } from "./toggles";

export type ClaimType =
  | "north_of"
  | "south_of"
  | "east_of"
  | "west_of"
  | "near"
  | "adjacent_to"
  | "borders"
  | "between"
  | "contains"
  | "within"
  | "separated_by"
  | "route_to"
  | "crosses"
  | "coastal_to"
  | "upstream_from"
  | "downstream_from";

export type ClaimBasis =
  | "explicit"
  | "strong_inference"
  | "tentative_inference";

export interface ClaimChronology {
  periods: ChronologyPeriod[];
  primary_period: ChronologyPeriod;
}

export interface SpatialClaim {
  claim_id: string;
  reference_id: string;
  subject_location_id: string;
  object_location_id: string;
  claim_type: ClaimType;
  claim_basis: ClaimBasis;
  source_phrase: string;
  toggle_sensitivity: string[];
  chronology: ClaimChronology;
  confidence: "low" | "medium" | "high";
  notes?: string;
}

export interface SpatialClaimsFile {
  spatial_claims: SpatialClaim[];
}