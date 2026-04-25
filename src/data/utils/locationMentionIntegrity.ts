import type { LocationMention, MentionUsefulness } from "../../types/locationMention";

const RELATIONAL_ROLES = new Set([
  "origin",
  "origin_city",
  "origin_region",
  "destination",
  "destination_city",
  "destination_region",
  "border_marker",
  "border_reference",
  "boundary_marker",
  "adjacency_marker",
  "route",
  "route_node",
  "route_reference",
  "destination_route",
  "transition_route",
  "crossing_marker",
  "course_reference",
  "frontier_zone",
  "coastal_anchor",
  "coastal_boundary",
  "theater_anchor",
  "theater_node",
  "theater_region",
  "battle_region",
  "battle_theater",
  "battle_zone",
  "battle_landmark",
  "supply_route",
  "supply_origin",
  "supply_destination",
  "arrival_coast",
  "arrival_region",
  "return_anchor",
  "return_destination",
  "return_region"
]);

const CONTEXTUAL_ROLES = new Set([
  "direct_location",
  "region_reference",
  "landmark_reference",
  "city_reference",
  "city_region",
  "linked_city",
  "linked_region",
  "macro_region",
  "gathering_city",
  "gathering_region",
  "gathering_landmark",
  "gathering_site",
  "civic_center",
  "civic_landmark",
  "civic_return",
  "core_region",
  "base_region",
  "defense_region",
  "fortified_site",
  "settlement_reference",
  "speech_landmark",
  "royal_center",
  "revelation_site",
  "resource_landmark",
  "resource_site",
  "admin_region",
  "discovered_location",
  "discovered_region",
  "terminal_battle_region",
  "contested_region",
  "continuity_region",
  "work_site",
  "camp_site",
  "encampment_site",
  "water_landmark",
  "voyage_origin",
  "rebuilt_site"
]);

const AMBIGUOUS_ROLES = new Set([
  "intercept_marker"
]);

export function normalizeMentionText(matchedText: string): string {
  return matchedText
    .replace(/\s+/g, " ")
    .replace(/\s+([,.;:!?])/g, "$1")
    .trim();
}

export function classifyMentionUsefulness(mention: LocationMention): MentionUsefulness {
  if (mention.certainty === "low" && !mention.is_explicit) {
    return "ambiguous";
  }

  if (AMBIGUOUS_ROLES.has(mention.mention_role)) {
    return "ambiguous";
  }

  if (RELATIONAL_ROLES.has(mention.mention_role)) {
    return "relational";
  }

  if (CONTEXTUAL_ROLES.has(mention.mention_role)) {
    return "contextual";
  }

  if (
    /normalized|inferred|temporary attachment|pilot purposes/i.test(mention.notes ?? "")
  ) {
    return "ambiguous";
  }

  if (mention.is_explicit) {
    return "contextual";
  }

  return "incidental";
}
