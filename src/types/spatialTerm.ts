export type SpatialTermCategory =
  | "cardinal_direction"
  | "directional_suffix"
  | "ambiguous_directional"
  | "movement_connector"
  | "proximity_indicator"
  | "adjacency_indicator"
  | "border_indicator"
  | "containment_indicator"
  | "route_indicator";

export interface SpatialTerm {
  term_id: string;
  term: string;
  category: SpatialTermCategory;
  subtype: string;
  toggle_group: string | null;
  possible_modes: string[];
  default_mode: string;
  notes?: string;
}

export interface SpatialTermsFile {
  spatial_terms: SpatialTerm[];
}