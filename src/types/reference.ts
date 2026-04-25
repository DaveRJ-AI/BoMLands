import type { ChronologyPeriod } from "./toggles";

export type ContextType =
  | "geographic_description"
  | "journey"
  | "military_campaign"
  | "missionary_journey"
  | "migration"
  | "settlement"
  | "border_description"
  | "battle"
  | "escape"
  | "administrative_description"
  | "general_mention"
  | "destruction_event"
  | "post_christ_ministry"
  | "gathering";

export interface ReferenceChronology {
  periods: ChronologyPeriod[];
  primary_period: ChronologyPeriod;
}

export interface ReferenceRecord {
  id: string;
  book: string;
  chapter: number;
  verse_start: number;
  verse_end: number;
  reference_label: string;
  text_excerpt: string;
  has_geographic_content: boolean;
  location_mentions: string[];
  direction_terms: string[];
  relation_terms: string[];
  movement_terms: string[];
  context_type: ContextType[];
  chronology: ReferenceChronology;
  ambiguity_flags: string[];
  review_status: "pending" | "reviewed" | "approved";
  review_notes?: string;
}

export interface ReferencesFile {
  references: ReferenceRecord[];
}