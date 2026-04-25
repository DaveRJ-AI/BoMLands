import type { Location } from "../../types/location";
import type { SpatialClaim } from "../../types/spatialClaim";
import type { EventRecord, EventStepRecord } from "../../types/event";
import type { ChronologyPeriod, ToggleState } from "../../types/toggles";

import { filterLocationsByChronology } from "../selectors/filterLocationsByChronology";
import { filterClaimsByChronology } from "../selectors/filterClaimsByChronology";
import { filterEventsByChronology, filterEventStepsByChronology } from "../selectors/filterEventsByChronology";
import {
  filterLocationsByNaturalFeaturesMode,
  filterLocationsByUnnamedRegionsMode
} from "../selectors/filterLocationsByFeatureToggle";
import { filterClaimsByInferenceMode } from "../selectors/filterClaimsByInferenceMode";

export interface ToggleApplicationInput {
  locations: Location[];
  spatialClaims: SpatialClaim[];
  events: EventRecord[];
  eventSteps: EventStepRecord[];
  toggles: ToggleState;
  selectedChronology: ChronologyPeriod[];
  selectedOverlayEventId?: string | null;
}

export interface ToggleApplicationResult {
  locations: Location[];
  spatialClaims: SpatialClaim[];
  events: EventRecord[];
  eventSteps: EventStepRecord[];
}

function filterClaimsByBorderMode(
  spatialClaims: SpatialClaim[],
  borderClaimsMode: ToggleState["border_claims_mode"]
): SpatialClaim[] {
  if (borderClaimsMode === "include") {
    return spatialClaims;
  }

  return spatialClaims.filter((claim) => claim.claim_type !== "borders");
}

function filterClaimsByTravelMode(
  spatialClaims: SpatialClaim[],
  travelEdgesMode: ToggleState["travel_edges_mode"]
): SpatialClaim[] {
  if (travelEdgesMode === "include") {
    return spatialClaims;
  }

  return spatialClaims.filter((claim) => claim.claim_type !== "route_to");
}

function filterEventsByOverlayMode(
  events: EventRecord[],
  eventSteps: EventStepRecord[],
  overlayMode: ToggleState["event_overlay_mode"],
  selectedOverlayEventId?: string | null
): { events: EventRecord[]; eventSteps: EventStepRecord[] } {
  if (overlayMode === "none") {
    return { events: [], eventSteps: [] };
  }

  const filteredByMode =
    overlayMode === "all"
      ? events
      : events.filter((event) => {
          const allowedEventTypes =
            overlayMode === "missionary"
              ? new Set(["missionary_journey"])
              : overlayMode === "military"
                ? new Set(["military_campaign"])
                : new Set(["migration"]);

          return allowedEventTypes.has(event.event_type);
        });

  const filteredEvents =
    selectedOverlayEventId && selectedOverlayEventId !== "all"
      ? filteredByMode.filter((event) => event.event_id === selectedOverlayEventId)
      : filteredByMode;
  const allowedEventIds = new Set(filteredEvents.map((event) => event.event_id));
  const filteredSteps = eventSteps.filter((step) => allowedEventIds.has(step.event_id));

  return {
    events: filteredEvents,
    eventSteps: filteredSteps
  };
}

export function applyToggles({
  locations,
  spatialClaims,
  events,
  eventSteps,
  toggles,
  selectedChronology,
  selectedOverlayEventId
}: ToggleApplicationInput): ToggleApplicationResult {
  let filteredLocations = filterLocationsByChronology(locations, selectedChronology);
  let filteredClaims = filterClaimsByChronology(spatialClaims, selectedChronology);
  let filteredEvents = filterEventsByChronology(events, selectedChronology);
  let filteredEventSteps = filterEventStepsByChronology(eventSteps, selectedChronology);

  filteredLocations = filterLocationsByNaturalFeaturesMode(
    filteredLocations,
    toggles.natural_features_mode
  );

  filteredLocations = filterLocationsByUnnamedRegionsMode(
    filteredLocations,
    toggles.unnamed_regions_mode
  );

  filteredClaims = filterClaimsByInferenceMode(
    filteredClaims,
    toggles.inference_mode
  );

  filteredClaims = filterClaimsByBorderMode(
    filteredClaims,
    toggles.border_claims_mode
  );

  filteredClaims = filterClaimsByTravelMode(
    filteredClaims,
    toggles.travel_edges_mode
  );

  const overlayFiltered = filterEventsByOverlayMode(
    filteredEvents,
    filteredEventSteps,
    toggles.event_overlay_mode,
    selectedOverlayEventId
  );

  filteredEvents = overlayFiltered.events;
  filteredEventSteps = overlayFiltered.eventSteps;

  const allowedLocationIds = new Set(filteredLocations.map((location) => location.id));

  filteredClaims = filteredClaims.filter(
    (claim) =>
      allowedLocationIds.has(claim.subject_location_id) &&
      allowedLocationIds.has(claim.object_location_id)
  );

  filteredEventSteps = filteredEventSteps.filter(
    (step) =>
      allowedLocationIds.has(step.from_location_id) &&
      allowedLocationIds.has(step.to_location_id)
  );

  const allowedEventIds = new Set(filteredEventSteps.map((step) => step.event_id));
  filteredEvents = filteredEvents.filter((event) => allowedEventIds.has(event.event_id));

  return {
    locations: filteredLocations,
    spatialClaims: filteredClaims,
    events: filteredEvents,
    eventSteps: filteredEventSteps
  };
}
