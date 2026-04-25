import type { ChronologyPeriod } from "./toggles";

export type FeatureType =
  | "city"
  | "land"
  | "wilderness"
  | "river"
  | "sea"
  | "hill"
  | "valley"
  | "mount"
  | "border_region"
  | "route"
  | "pass"
  | "neck"
  | "coast"
  | "region"
  | "structure_landmark"
  | "unknown_geographic";

export type NamedStatus =
  | "named"
  | "unnamed"
  | "named_descriptor"
  | "mixed"
  | "abstract";

export type LocationLifecycleStatus =
  | "active"
  | "affected"
  | "destroyed"
  | "rebuilt"
  | "renamed"
  | "uncertain"
  | "legacy_reference"
  | "not_applicable"
  | "burned";

export type LocationNodeKind =
  | "source_location"
  | "derived_overlay"
  | "analytical_construct";

export type LocationEvidenceStatus =
  | "source_grounded"
  | "inference_supported"
  | "analytical_abstract"
  | "coverage_review_needed";

export interface ChronologyInfo {
  periods: ChronologyPeriod[];
  primary_period: ChronologyPeriod;
  status_by_period: Partial<Record<ChronologyPeriod, LocationLifecycleStatus>>;
}

export interface Location {
  id: string;
  canonical_name: string;
  display_name: string;
  entity_class: "location";
  feature_type: FeatureType;
  named_status: NamedStatus;
  root_name: string;
  variant_forms: string[];
  linked_entities: string[];
  merge_group: string;
  default_merge_behavior: "merged" | "separate";
  first_reference: string;
  status: string;
  overlap_group?: string;
  chronology: ChronologyInfo;
    render_domain?: string;
  region_scope?: string;
  map_role?: string;
  visibility_tier?: string;
  certainty_level?: string;
  default_render_state?: "visible" | "detail_only" | "chronology_only" | "hidden";
  classification_rationale?: string;
  notes?: string;
  node_kind?: LocationNodeKind;
  evidence_status?: LocationEvidenceStatus;
}

export interface LocationsFile {
  locations: Location[];
}
