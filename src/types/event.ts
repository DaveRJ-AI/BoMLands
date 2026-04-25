import type { ChronologyPeriod } from "./toggles";

export type EventType =
  | "missionary_journey"
  | "military_campaign"
  | "migration"
  | "royal_travel"
  | "preaching_circuit"
  | "escape_route"
  | "exploratory_travel"
  | "administrative_movement"
  | "cataclysm"
  | "post_christ_ministry";

export interface EventChronology {
  periods: ChronologyPeriod[];
  primary_period: ChronologyPeriod;
}

export interface EventTimeScope {
  book: string;
  chapter_start: number;
  chapter_end: number;
}

export interface EventRecord {
  event_id: string;
  event_name: string;
  event_type: EventType;
  time_scope: EventTimeScope;
  participants: string[];
  summary: string;
  related_references: string[];
  path_mode: "sequence_based" | "point_to_point";
  chronology: EventChronology;
  notes?: string;
}

export interface EventsFile {
  events: EventRecord[];
}

export type EventStepType =
  | "travel"
  | "dispersion"
  | "return"
  | "boundary_trace"
  | "territorial_span"
  | "border_transition"
  | "gateway_relation"
  | "distance_estimate"
  | "threat_projection"
  | "defensive_redeployment"
  | "battle_movement"
  | "retreat_or_escape"
  | "fortification_chain"
  | "rapid_march"
  | "encampment"
  | "gateway_security"
  | "decoy_movement"
  | "city_recovery"
  | "prisoner_exchange_operation"
  | "city_loss"
  | "campaign_pressure"
  | "decoy_retreat"
  | "advance_and_capture"
  | "internal_redeployment"
  | "external_redeployment"
  | "destruction_marker"
  | "terrain_transformation"
  | "regional_transformation"
  | "gathering"
  | "dispersal"
  | "broadcast_dispersal"
  | "covenant_gathering_marker";

export interface EventStepRecord {
  event_step_id: string;
  event_id: string;
  step_order: number;
  reference_id: string;
  from_location_id: string;
  to_location_id: string;
  step_type: EventStepType;
  path_certainty: "low" | "medium" | "high";
  direction_terms: string[];
  toggle_sensitivity: string[];
  chronology: EventChronology;
  notes?: string;
}

export interface EventStepsFile {
  event_steps: EventStepRecord[];
}