export type MentionRole = string;

export type MentionUsefulness =
  | "relational"
  | "incidental"
  | "contextual"
  | "ambiguous";

export interface LocationMention {
  mention_id: string;
  reference_id: string;
  location_id: string;
  matched_text: string;
  mention_role: MentionRole;
  is_explicit: boolean;
  certainty: "low" | "medium" | "high";
  surrounding_phrase: string;
  notes?: string;
}

export interface LocationMentionsFile {
  location_mentions: LocationMention[];
}
