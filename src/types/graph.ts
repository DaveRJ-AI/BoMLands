import type { ChronologyPeriod } from "./toggles";
import type { FeatureType, LocationEvidenceStatus, LocationNodeKind } from "./location";
import type { ClaimType } from "./spatialClaim";

export interface GraphNode {
  id: string;
  label: string;
  feature_type: FeatureType;
  chronology_periods: ChronologyPeriod[];
  primary_period: ChronologyPeriod;
  overlap_group?: string;
  x?: number;
  y?: number;
  metadata?: {
  source_location_id?: string;
  status?: string;
  notes?: string;

  render_domain?: string;
  region_scope?: string;
  map_role?: string;
  visibility_tier?: string;
  certainty_level?: string;
  default_render_state?: "visible" | "detail_only" | "chronology_only" | "hidden";
  classification_rationale?: string;
  node_kind?: LocationNodeKind;
  evidence_status?: LocationEvidenceStatus;

  first_reference?: string;
linked_entities?: string[];
};
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  claim_type: ClaimType | string;
  chronology_periods: ChronologyPeriod[];
  primary_period: ChronologyPeriod;
  weight?: number;
  confidence?: "low" | "medium" | "high";
  reference_id?: string;
  toggle_sensitivity?: string[];
  metadata?: {
    claim_basis?: string;
    source_phrase?: string;
    notes?: string;
  };
}

export interface OverlayPathStep {
  event_step_id: string;
  from_node_id: string;
  to_node_id: string;
  step_type: string;
  chronology_periods: ChronologyPeriod[];
  primary_period: ChronologyPeriod;
  direction_terms: string[];
  toggle_sensitivity: string[];
  reference_id: string;
  notes?: string;
}

export interface OverlayPath {
  event_id: string;
  event_name?: string;
  event_type?: string;
  chronology_periods: ChronologyPeriod[];
  primary_period: ChronologyPeriod;
  steps: OverlayPathStep[];
}

export interface GraphDataset {
  nodes: GraphNode[];
  edges: GraphEdge[];
  overlays?: OverlayPath[];
}
