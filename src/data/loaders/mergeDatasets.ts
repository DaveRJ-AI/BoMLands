import type { AppConfig } from "../../types/toggles";
import type { Location, LocationsFile } from "../../types/location";
import type { ReferenceRecord, ReferencesFile } from "../../types/reference";
import type { LocationMention, LocationMentionsFile } from "../../types/locationMention";
import type { SpatialClaim, SpatialClaimsFile } from "../../types/spatialClaim";
import type { SpatialTerm, SpatialTermsFile } from "../../types/spatialTerm";
import type { EventRecord, EventStepRecord, EventsFile, EventStepsFile } from "../../types/event";

export interface DatasetBundle {
  appConfig?: AppConfig;
  locations?: Location[];
  references?: ReferenceRecord[];
  locationMentions?: LocationMention[];
  spatialClaims?: SpatialClaim[];
  spatialTerms?: SpatialTerm[];
  events?: EventRecord[];
  eventSteps?: EventStepRecord[];
}

function dedupeById<T, K extends keyof T>(items: T[], idKey: K): T[] {
  const seen = new Map<T[K], T>();

  for (const item of items) {
    const id = item[idKey];
    if (!seen.has(id)) {
      seen.set(id, item);
    }
  }

  return Array.from(seen.values());
}


function sortReferences(references: ReferenceRecord[]): ReferenceRecord[] {
  return [...references].sort((a, b) => {
    if (a.book !== b.book) return a.book.localeCompare(b.book);
    if (a.chapter !== b.chapter) return a.chapter - b.chapter;
    if (a.verse_start !== b.verse_start) return a.verse_start - b.verse_start;
    return a.verse_end - b.verse_end;
  });
}

function sortEventSteps(eventSteps: EventStepRecord[]): EventStepRecord[] {
  return [...eventSteps].sort((a, b) => {
    if (a.event_id !== b.event_id) return a.event_id.localeCompare(b.event_id);
    return a.step_order - b.step_order;
  });
}

export function mergeDatasets(...datasets: DatasetBundle[]): DatasetBundle {
  const merged: DatasetBundle = {
    appConfig: datasets.find((d) => d.appConfig)?.appConfig,
    locations: [],
    references: [],
    locationMentions: [],
    spatialClaims: [],
    spatialTerms: [],
    events: [],
    eventSteps: []
  };

  for (const dataset of datasets) {
    if (dataset.locations) merged.locations!.push(...dataset.locations);
    if (dataset.references) merged.references!.push(...dataset.references);
    if (dataset.locationMentions) merged.locationMentions!.push(...dataset.locationMentions);
    if (dataset.spatialClaims) merged.spatialClaims!.push(...dataset.spatialClaims);
    if (dataset.spatialTerms) merged.spatialTerms!.push(...dataset.spatialTerms);
    if (dataset.events) merged.events!.push(...dataset.events);
    if (dataset.eventSteps) merged.eventSteps!.push(...dataset.eventSteps);
  }

  merged.locations = dedupeById(merged.locations!, "id");
  merged.references = sortReferences(dedupeById(merged.references!, "id"));
  merged.locationMentions = dedupeById(merged.locationMentions!, "mention_id");
  merged.spatialClaims = dedupeById(merged.spatialClaims!, "claim_id");
  merged.spatialTerms = dedupeById(merged.spatialTerms!, "term_id");
  merged.events = dedupeById(merged.events!, "event_id");
  merged.eventSteps = sortEventSteps(dedupeById(merged.eventSteps!, "event_step_id"));

  return merged;
}

export function toLocationsFile(locations: Location[]): LocationsFile {
  return { locations };
}

export function toReferencesFile(references: ReferenceRecord[]): ReferencesFile {
  return { references };
}

export function toLocationMentionsFile(locationMentions: LocationMention[]): LocationMentionsFile {
  return { location_mentions: locationMentions };
}

export function toSpatialClaimsFile(spatialClaims: SpatialClaim[]): SpatialClaimsFile {
  return { spatial_claims: spatialClaims };
}

export function toSpatialTermsFile(spatialTerms: SpatialTerm[]): SpatialTermsFile {
  return { spatial_terms: spatialTerms };
}

export function toEventsFile(events: EventRecord[]): EventsFile {
  return { events };
}

export function toEventStepsFile(eventSteps: EventStepRecord[]): EventStepsFile {
  return { event_steps: eventSteps };
}