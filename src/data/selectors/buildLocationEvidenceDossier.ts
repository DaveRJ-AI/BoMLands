import type { CoreDataset } from "../loaders/loadCoreData";
import type { EventRecord, EventStepRecord } from "../../types/event";
import type { Location } from "../../types/location";
import type { LocationMention } from "../../types/locationMention";
import type { ReferenceRecord } from "../../types/reference";
import type { SpatialClaim, ClaimType } from "../../types/spatialClaim";
import bomVerses from "../../../data/bom_text";
import { classifyLocationIntegrity } from "../utils/locationIntegrity";

import { getClaimsForLocation } from "./getClaimsForLocation";
import { getEventsForLocation } from "./getEventsForLocation";

const BOOK_ORDER = [
  "1 Nephi",
  "2 Nephi",
  "Jacob",
  "Enos",
  "Jarom",
  "Omni",
  "Words of Mormon",
  "Mosiah",
  "Alma",
  "Helaman",
  "3 Nephi",
  "4 Nephi",
  "Mormon",
  "Ether",
  "Moroni"
] as const;

type EvidenceStrength = "strong" | "moderate" | "light";
type InferenceLoad = "low" | "medium" | "high";
type ReviewStatus = "settled" | "under review" | "contested";
type CoverageState =
  | "full_source_text_loaded"
  | "extraction_set_may_be_incomplete"
  | "strong_phrase_reconciliation_closed";

type BomVerse = (typeof bomVerses)[number];

export interface LocationEvidenceCoverage {
  sourceTextState: CoverageState;
  referenceSetState: CoverageState;
  note: string;
}

export interface LocationEvidenceReference {
  reference: ReferenceRecord;
  sourceVerses: BomVerse[];
  mentions: LocationMention[];
  relatedClaims: SpatialClaim[];
  relatedEventSteps: EventStepRecord[];
}

export interface LocationEvidenceSummary {
  totalReferences: number;
  totalMentions: number;
  totalClaims: number;
  totalEventSteps: number;
  nodeKind: string;
  evidenceStatus: string;
  textDrivenStrength: EvidenceStrength;
  inferenceLoad: InferenceLoad;
  reviewStatus: ReviewStatus;
}

export interface LocationPlacementConsiderations {
  textDriven: string[];
  inferenceDriven: string[];
  readabilityDriven: string[];
  openQuestions: string[];
}

export interface LocationEvidenceDossier {
  location: Location | null;
  sourceLocationIds: string[];
  references: LocationEvidenceReference[];
  mentions: LocationMention[];
  claims: SpatialClaim[];
  events: EventRecord[];
  eventSteps: EventStepRecord[];
  relatedLocations: Location[];
  summary: LocationEvidenceSummary;
  coverage: LocationEvidenceCoverage;
  placementConsiderations: LocationPlacementConsiderations;
}

export interface RelationshipEvidenceDossier {
  anchorLocation: Location | null;
  anchorLocationIds: string[];
  otherLocation: Location | null;
  claims: SpatialClaim[];
  references: LocationEvidenceReference[];
}

const CLAIM_LABELS: Record<ClaimType, string> = {
  north_of: "north of",
  south_of: "south of",
  east_of: "east of",
  west_of: "west of",
  near: "near",
  adjacent_to: "adjacent to",
  borders: "borders",
  between: "between",
  contains: "contains",
  within: "within",
  separated_by: "is separated by",
  route_to: "has a route relation to",
  crosses: "crosses",
  coastal_to: "is coastal to",
  upstream_from: "is upstream from",
  downstream_from: "is downstream from"
};

const CLAIM_INVERSES: Partial<Record<ClaimType, ClaimType>> = {
  north_of: "south_of",
  south_of: "north_of",
  east_of: "west_of",
  west_of: "east_of",
  contains: "within",
  within: "contains",
  upstream_from: "downstream_from",
  downstream_from: "upstream_from"
};

function sortReferences(a: ReferenceRecord, b: ReferenceRecord): number {
  const bookDelta = BOOK_ORDER.indexOf(a.book as (typeof BOOK_ORDER)[number]) -
    BOOK_ORDER.indexOf(b.book as (typeof BOOK_ORDER)[number]);

  if (bookDelta !== 0) return bookDelta;
  if (a.chapter !== b.chapter) return a.chapter - b.chapter;
  if (a.verse_start !== b.verse_start) return a.verse_start - b.verse_start;
  return a.verse_end - b.verse_end;
}

function dedupeById<T extends { id?: string; mention_id?: string; claim_id?: string; event_step_id?: string; event_id?: string }>(
  items: T[]
): T[] {
  const seen = new Set<string>();

  return items.filter((item) => {
    const key =
      item.id ??
      item.mention_id ??
      item.claim_id ??
      item.event_step_id ??
      item.event_id;

    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function getLocationLabel(locationMap: Map<string, Location>, locationId: string): string {
  return locationMap.get(locationId)?.display_name ?? locationId;
}

function describeClaimForLocation(
  claim: SpatialClaim,
  locationId: string,
  locationMap: Map<string, Location>
): string {
  if (claim.subject_location_id === locationId) {
    const otherLabel = getLocationLabel(locationMap, claim.object_location_id);
    return `${CLAIM_LABELS[claim.claim_type]} ${otherLabel}`;
  }

  const invertedType = CLAIM_INVERSES[claim.claim_type] ?? claim.claim_type;
  const otherLabel = getLocationLabel(locationMap, claim.subject_location_id);
  return `${CLAIM_LABELS[invertedType]} ${otherLabel}`;
}

function summarizeClaimSet(
  claims: SpatialClaim[],
  locationId: string,
  locationMap: Map<string, Location>
): string | null {
  if (claims.length === 0) return null;

  const descriptions = claims
    .slice(0, 4)
    .map((claim) => describeClaimForLocation(claim, locationId, locationMap));

  return descriptions.join("; ");
}

function getEvidenceStrength(
  references: LocationEvidenceReference[],
  claims: SpatialClaim[]
): EvidenceStrength {
  const directMentions = references.reduce((count, entry) => {
    return count + entry.mentions.filter((mention) => mention.is_explicit).length;
  }, 0);
  const explicitClaims = claims.filter((claim) => claim.claim_basis === "explicit").length;

  if (directMentions >= 4 || explicitClaims >= 2) {
    return "strong";
  }

  if (directMentions >= 2 || explicitClaims >= 1 || references.length >= 3) {
    return "moderate";
  }

  return "light";
}

function getInferenceLoad(claims: SpatialClaim[]): InferenceLoad {
  const tentativeClaims = claims.filter((claim) => claim.claim_basis === "tentative_inference").length;
  const strongInferenceClaims = claims.filter(
    (claim) => claim.claim_basis === "strong_inference"
  ).length;

  if (tentativeClaims >= 2 || (tentativeClaims >= 1 && strongInferenceClaims >= 1)) {
    return "high";
  }

  if (tentativeClaims >= 1 || strongInferenceClaims >= 1) {
    return "medium";
  }

  return "low";
}

function getReviewStatus(
  references: LocationEvidenceReference[],
  claims: SpatialClaim[]
): ReviewStatus {
  const hasAmbiguity = references.some(
    (entry) => entry.reference.ambiguity_flags && entry.reference.ambiguity_flags.length > 0
  );
  const hasLowConfidenceTentativeClaim = claims.some(
    (claim) => claim.claim_basis === "tentative_inference" || claim.confidence === "low"
  );

  if (hasAmbiguity || hasLowConfidenceTentativeClaim) {
    return "contested";
  }

  const allReferencesApproved = references.every(
    (entry) => entry.reference.review_status === "approved"
  );

  if (references.length > 0 && claims.length > 0 && allReferencesApproved) {
    return "settled";
  }

  return "under review";
}

function buildPlacementConsiderations(
  locationId: string,
  location: Location | null,
  references: LocationEvidenceReference[],
  claims: SpatialClaim[],
  eventSteps: EventStepRecord[],
  locationMap: Map<string, Location>
): LocationPlacementConsiderations {
  const directMentions = references.flatMap((entry) =>
    entry.mentions.filter((mention) => mention.is_explicit)
  );
  const explicitClaims = claims.filter((claim) => claim.claim_basis === "explicit");
  const strongInferenceClaims = claims.filter(
    (claim) => claim.claim_basis === "strong_inference"
  );
  const tentativeClaims = claims.filter(
    (claim) => claim.claim_basis === "tentative_inference"
  );

  const textDriven: string[] = [];
  const inferenceDriven: string[] = [];
  const readabilityDriven: string[] = [];
  const openQuestions: string[] = [];

  if (references.length > 0) {
    textDriven.push(
      `This location appears across ${references.length} reference${references.length === 1 ? "" : "s"}, which should be reviewed in scripture order before making placement changes.`
    );
  }

  if (directMentions.length > 0) {
    textDriven.push(
      `Direct location mentions occur ${directMentions.length} time${directMentions.length === 1 ? "" : "s"} in the extracted reference set, giving the strongest textual footing for placement review.`
    );
  }

  const explicitClaimSummary = summarizeClaimSet(explicitClaims, locationId, locationMap);
  if (explicitClaimSummary) {
    textDriven.push(`Explicit spatial claims place this location ${explicitClaimSummary}.`);
  }

  const strongInferenceSummary = summarizeClaimSet(
    strongInferenceClaims,
    locationId,
    locationMap
  );
  if (strongInferenceSummary) {
    inferenceDriven.push(
      `Strong inference claims also connect this location ${strongInferenceSummary}.`
    );
  }

  const tentativeClaimSummary = summarizeClaimSet(tentativeClaims, locationId, locationMap);
  if (tentativeClaimSummary) {
    inferenceDriven.push(
      `Tentative inference claims remain in play and should be treated cautiously: ${tentativeClaimSummary}.`
    );
  }

  if (eventSteps.length > 0) {
    inferenceDriven.push(
      `Event and movement steps involving this location provide corridor context, but they should stay subordinate to direct geographic description when determining final placement.`
    );
  }

  readabilityDriven.push(
    `On-map readability should remain subordinate to the relational backbone in buildRelationalLayout.ts; presentation refinements should not defeat stronger source relationships.`
  );

  if (location?.linked_entities && location.linked_entities.length > 0) {
    readabilityDriven.push(
      `Linked entities (${location.linked_entities.join(", ")}) should stay visually reviewable together, but not at the cost of stronger textual evidence.`
    );
  }

  const ambiguousReferences = references.filter(
    (entry) => entry.reference.ambiguity_flags.length > 0
  );
  if (ambiguousReferences.length > 0) {
    openQuestions.push(
      `Ambiguity flags are present in ${ambiguousReferences.length} reference${ambiguousReferences.length === 1 ? "" : "s"} and should be revisited before treating placement as settled.`
    );
  }

  if (tentativeClaims.length > 0) {
    openQuestions.push(
      `Tentative claims should be distinguished from explicit claims when deciding whether the current position is text-driven or only provisionally inferred.`
    );
  }

  if (explicitClaims.length === 0 && directMentions.length > 0) {
    openQuestions.push(
      `This location has mention evidence without much explicit spatial claim support, so broader verse context may still be needed to tighten placement.`
    );
  }

  return {
    textDriven,
    inferenceDriven,
    readabilityDriven,
    openQuestions
  };
}

function getSourceVersesForReference(reference: ReferenceRecord): BomVerse[] {
  return bomVerses.filter(
    (verse) =>
      verse.book === reference.book &&
      verse.chapter === reference.chapter &&
      verse.verse >= reference.verse_start &&
      verse.verse <= reference.verse_end
  );
}

export function buildRelationshipEvidenceDossier(
  coreDataset: CoreDataset,
  anchorLocationId: string | string[],
  otherLocationId: string
): RelationshipEvidenceDossier {
  const anchorLocationIds = Array.isArray(anchorLocationId)
    ? Array.from(new Set(anchorLocationId))
    : [anchorLocationId];
  const locationMap = new Map(coreDataset.locations.map((entry) => [entry.id, entry]));
  const claims = coreDataset.spatialClaims.filter((claim) => {
    const forwardMatch =
      anchorLocationIds.includes(claim.subject_location_id) &&
      claim.object_location_id === otherLocationId;
    const reverseMatch =
      claim.subject_location_id === otherLocationId &&
      anchorLocationIds.includes(claim.object_location_id);

    return forwardMatch || reverseMatch;
  });

  const referenceIds = new Set(claims.map((claim) => claim.reference_id));
  const references = coreDataset.references
    .filter((reference) => referenceIds.has(reference.id))
    .sort(sortReferences);

  const relevantMentions = coreDataset.locationMentions.filter(
    (mention) =>
      referenceIds.has(mention.reference_id) &&
      (mention.location_id === anchorLocationId || mention.location_id === otherLocationId)
  );
  const relevantEventSteps = coreDataset.eventSteps.filter((step) =>
    referenceIds.has(step.reference_id)
  );

  const referenceEntries: LocationEvidenceReference[] = references.map((reference) => ({
    reference,
    sourceVerses: getSourceVersesForReference(reference),
    mentions: relevantMentions.filter((mention) => mention.reference_id === reference.id),
    relatedClaims: claims.filter((claim) => claim.reference_id === reference.id),
    relatedEventSteps: relevantEventSteps.filter((step) => step.reference_id === reference.id)
  }));

  return {
    anchorLocation: locationMap.get(anchorLocationIds[0]) ?? null,
    anchorLocationIds,
    otherLocation: locationMap.get(otherLocationId) ?? null,
    claims,
    references: referenceEntries
  };
}

export function buildLocationEvidenceDossier(
  coreDataset: CoreDataset,
  locationId: string | string[]
): LocationEvidenceDossier {
  const sourceLocationIds = Array.isArray(locationId)
    ? Array.from(new Set(locationId))
    : [locationId];
  const primaryLocationId = sourceLocationIds[0];
  const location = coreDataset.locations.find((entry) => entry.id === primaryLocationId) ?? null;
  const locationMap = new Map(coreDataset.locations.map((entry) => [entry.id, entry]));

  const mentions = coreDataset.locationMentions.filter(
    (mention) => sourceLocationIds.includes(mention.location_id)
  );
  const claims = dedupeById(
    sourceLocationIds.flatMap((id) => getClaimsForLocation(coreDataset.spatialClaims, id))
  );
  const eventSteps = coreDataset.eventSteps.filter(
    (step) =>
      sourceLocationIds.includes(step.from_location_id) ||
      sourceLocationIds.includes(step.to_location_id)
  );
  const events = dedupeById(
    sourceLocationIds.flatMap((id) =>
      getEventsForLocation(coreDataset.events, coreDataset.eventSteps, id)
    )
  );

  const referenceIds = new Set<string>([
    ...mentions.map((mention) => mention.reference_id),
    ...claims.map((claim) => claim.reference_id),
    ...eventSteps.map((step) => step.reference_id),
    ...events.flatMap((event) => event.related_references)
  ]);

  const references = coreDataset.references
    .filter((reference) => referenceIds.has(reference.id))
    .sort(sortReferences);

  const referenceEntries: LocationEvidenceReference[] = references.map((reference) => ({
    reference,
    sourceVerses: getSourceVersesForReference(reference),
    mentions: mentions.filter((mention) => mention.reference_id === reference.id),
    relatedClaims: claims.filter((claim) => claim.reference_id === reference.id),
    relatedEventSteps: eventSteps.filter((step) => step.reference_id === reference.id)
  }));

  const relatedLocationIds = new Set<string>();
  for (const claim of claims) {
    if (!sourceLocationIds.includes(claim.subject_location_id)) {
      relatedLocationIds.add(claim.subject_location_id);
    }
    if (!sourceLocationIds.includes(claim.object_location_id)) {
      relatedLocationIds.add(claim.object_location_id);
    }
  }

  for (const sourceId of sourceLocationIds) {
    const sourceLocation = locationMap.get(sourceId);
    for (const linkedEntity of sourceLocation?.linked_entities ?? []) {
      if (locationMap.has(linkedEntity) && !sourceLocationIds.includes(linkedEntity)) {
        relatedLocationIds.add(linkedEntity);
      }
    }
  }

  const relatedLocations = dedupeById(
    [...relatedLocationIds]
      .map((id) => locationMap.get(id))
      .filter((entry): entry is Location => Boolean(entry))
  ).sort((a, b) => a.display_name.localeCompare(b.display_name));

  const summary: LocationEvidenceSummary = {
    totalReferences: referenceEntries.length,
    totalMentions: mentions.length,
    totalClaims: claims.length,
    totalEventSteps: eventSteps.length,
    nodeKind: location ? classifyLocationIntegrity(location, {
      references: referenceEntries.length,
      claims: claims.length
    }).nodeKind : "source_location",
    evidenceStatus: location ? classifyLocationIntegrity(location, {
      references: referenceEntries.length,
      claims: claims.length
    }).evidenceStatus : "coverage_review_needed",
    textDrivenStrength: getEvidenceStrength(referenceEntries, claims),
    inferenceLoad: getInferenceLoad(claims),
    reviewStatus: getReviewStatus(referenceEntries, claims)
  };

  return {
    location,
    sourceLocationIds,
    references: referenceEntries,
    mentions,
    claims,
    events,
    eventSteps,
    relatedLocations,
    summary,
    coverage: {
      sourceTextState: "full_source_text_loaded",
      referenceSetState: "strong_phrase_reconciliation_closed",
      note:
        "Canonical verse text is shown for the references currently present in the extracted dataset. The current strong-phrase reconciliation audit is closed for both source locations and derived overlays, so this dossier is on a much stronger footing than earlier passes. Lower-signal references or future extraction refinements may still expand it over time."
    },
    placementConsiderations: buildPlacementConsiderations(
      primaryLocationId,
      location,
      referenceEntries,
      claims,
      eventSteps,
      locationMap
    )
  };
}
