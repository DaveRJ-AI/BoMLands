import type { AppConfig } from "../../types/toggles";
import type { LocationsFile } from "../../types/location";
import type { ReferencesFile } from "../../types/reference";
import type { LocationMentionsFile } from "../../types/locationMention";
import type { SpatialClaimsFile } from "../../types/spatialClaim";
import type { SpatialTermsFile } from "../../types/spatialTerm";
import type { EventsFile, EventStepsFile } from "../../types/event";

import appConfigJson from "../../../data/core/app_config.json";
import locationsJson from "../../../data/core/locations.json";
import referencesJson from "../../../data/core/references.json";
import locationMentionsJson from "../../../data/core/location_mentions.json";
import spatialClaimsJson from "../../../data/core/spatial_claims.json";
import spatialTermsJson from "../../../data/core/spatial_terms.json";
import eventsJson from "../../../data/core/events.json";
import eventStepsJson from "../../../data/core/event_steps.json";

export interface CoreDataset {
  appConfig: AppConfig;
  locations: LocationsFile["locations"];
  references: ReferencesFile["references"];
  locationMentions: LocationMentionsFile["location_mentions"];
  spatialClaims: SpatialClaimsFile["spatial_claims"];
  spatialTerms: SpatialTermsFile["spatial_terms"];
  events: EventsFile["events"];
  eventSteps: EventStepsFile["event_steps"];
}

function flattenWrappedItems<T>(
  items: unknown[],
  wrapperKey: string
): T[] {
  const flattened: T[] = [];

  for (const item of items) {
    if (
      item &&
      typeof item === "object" &&
      !Array.isArray(item) &&
      wrapperKey in item
    ) {
      const nestedItems = (item as Record<string, unknown>)[wrapperKey];
      if (Array.isArray(nestedItems)) {
        flattened.push(...flattenWrappedItems<T>(nestedItems, wrapperKey));
        continue;
      }
    }

    flattened.push(item as T);
  }

  return flattened;
}

function normalizeWrappedArray<T>(
  payload: Record<string, unknown>,
  wrapperKey: string
): T[] {
  const rawItems = payload[wrapperKey];
  if (!Array.isArray(rawItems)) {
    return [];
  }

  return flattenWrappedItems<T>(rawItems, wrapperKey);
}

function buildCoreDatasetFromPayloads(payloads: {
  appConfig: AppConfig;
  locationsFile: LocationsFile;
  referencesFile: ReferencesFile;
  locationMentionsFile: LocationMentionsFile;
  spatialClaimsFile: SpatialClaimsFile;
  spatialTermsFile: SpatialTermsFile;
  eventsFile: EventsFile;
  eventStepsFile: EventStepsFile;
}): CoreDataset {
  const {
    appConfig,
    locationsFile,
    referencesFile,
    locationMentionsFile,
    spatialClaimsFile,
    spatialTermsFile,
    eventsFile,
    eventStepsFile
  } = payloads;

  return {
    appConfig,
    locations: normalizeWrappedArray<LocationsFile["locations"][number]>(
      locationsFile as unknown as Record<string, unknown>,
      "locations"
    ),
    references: normalizeWrappedArray<ReferencesFile["references"][number]>(
      referencesFile as unknown as Record<string, unknown>,
      "references"
    ),
    locationMentions: normalizeWrappedArray<LocationMentionsFile["location_mentions"][number]>(
      locationMentionsFile as unknown as Record<string, unknown>,
      "location_mentions"
    ),
    spatialClaims: normalizeWrappedArray<SpatialClaimsFile["spatial_claims"][number]>(
      spatialClaimsFile as unknown as Record<string, unknown>,
      "spatial_claims"
    ),
    spatialTerms: normalizeWrappedArray<SpatialTermsFile["spatial_terms"][number]>(
      spatialTermsFile as unknown as Record<string, unknown>,
      "spatial_terms"
    ),
    events: normalizeWrappedArray<EventsFile["events"][number]>(
      eventsFile as unknown as Record<string, unknown>,
      "events"
    ),
    eventSteps: normalizeWrappedArray<EventStepsFile["event_steps"][number]>(
      eventStepsFile as unknown as Record<string, unknown>,
      "event_steps"
    )
  };
}

async function loadJson<T>(path: string): Promise<T> {
  const response = await fetch(path);

  if (!response.ok) {
    throw new Error(`Failed to load JSON from ${path}: ${response.status} ${response.statusText}`);
  }

  return (await response.json()) as T;
}

export async function loadCoreData(basePath = "/data/core"): Promise<CoreDataset> {
  if (basePath === "/data/core") {
    return buildCoreDatasetFromPayloads({
      appConfig: appConfigJson as AppConfig,
      locationsFile: locationsJson as LocationsFile,
      referencesFile: referencesJson as ReferencesFile,
      locationMentionsFile: locationMentionsJson as LocationMentionsFile,
      spatialClaimsFile: spatialClaimsJson as SpatialClaimsFile,
      spatialTermsFile: spatialTermsJson as SpatialTermsFile,
      eventsFile: eventsJson as EventsFile,
      eventStepsFile: eventStepsJson as EventStepsFile
    });
  }

  const [
    appConfig,
    locationsFile,
    referencesFile,
    locationMentionsFile,
    spatialClaimsFile,
    spatialTermsFile,
    eventsFile,
    eventStepsFile
  ] = await Promise.all([
    loadJson<AppConfig>(`${basePath}/app_config.json`),
    loadJson<LocationsFile>(`${basePath}/locations.json`),
    loadJson<ReferencesFile>(`${basePath}/references.json`),
    loadJson<LocationMentionsFile>(`${basePath}/location_mentions.json`),
    loadJson<SpatialClaimsFile>(`${basePath}/spatial_claims.json`),
    loadJson<SpatialTermsFile>(`${basePath}/spatial_terms.json`),
    loadJson<EventsFile>(`${basePath}/events.json`),
    loadJson<EventStepsFile>(`${basePath}/event_steps.json`)
  ]);

  return buildCoreDatasetFromPayloads({
    appConfig,
    locationsFile,
    referencesFile,
    locationMentionsFile,
    spatialClaimsFile,
    spatialTermsFile,
    eventsFile,
    eventStepsFile
  });
}
