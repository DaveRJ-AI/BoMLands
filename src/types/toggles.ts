export type UpDownMode = "direction" | "elevation" | "exclude";

export type CityLandMode = "merged" | "separate";

export type InferenceMode =
  | "explicit_only"
  | "explicit_plus_strong"
  | "all";

export type IncludeExcludeMode = "include" | "exclude";

export type EventOverlayMode =
  | "none"
  | "missionary"
  | "military"
  | "migration"
  | "all";

export type CampaignRenderMode =
  | "point_to_point"
  | "inferred_route"
  | "sequence_only";

export type ChronologyPeriod =
  | "jaredite"
  | "pre_christ"
  | "destruction"
  | "post_christ";

  export type RenderDomain =
  | "new_world_map"
  | "old_world_map"
  | "jaredite_map"
  | "transition";

export interface ToggleState {
  up_down_mode: UpDownMode;
  city_land_mode: CityLandMode;
  inference_mode: InferenceMode;
  unnamed_regions_mode: IncludeExcludeMode;
  natural_features_mode: IncludeExcludeMode;
  border_claims_mode: IncludeExcludeMode;
  travel_edges_mode: IncludeExcludeMode;
  event_overlay_mode: EventOverlayMode;
  campaign_render_mode: CampaignRenderMode;
}

export interface AppConfig {
  dataset_version: string;
  default_toggles: ToggleState;
  default_chronology_selection: ChronologyPeriod[];
  available_chronology_periods: ChronologyPeriod[];
  chronology_labels: Record<ChronologyPeriod, string>;
  map_rendering: {
    show_overlap_groups: boolean;
    show_period_status_badges: boolean;
    separate_overlapping_labels: boolean;
    stack_same_zone_periods: boolean;
    fade_nonselected_periods: boolean;
  };
  overlay_options: {
    missionary: boolean;
    military: boolean;
    migration: boolean;
    post_christ_ministry: boolean;
    cataclysm: boolean;
  };
}