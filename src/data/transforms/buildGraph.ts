import type { ChronologyPeriod } from "../../types/toggles";
import type { Location } from "../../types/location";
import type { SpatialClaim } from "../../types/spatialClaim";
import type { EventRecord, EventStepRecord } from "../../types/event";
import type {
  GraphDataset,
  GraphEdge,
  GraphNode,
  OverlayPath,
  OverlayPathStep
} from "../../types/graph";
import { classifyLocationIntegrity } from "../utils/locationIntegrity";

function normalizePeriods(periods: unknown): ChronologyPeriod[] {
  if (!Array.isArray(periods)) {
    return [];
  }

  return periods.filter(
    (period): period is ChronologyPeriod =>
      period === "jaredite" ||
      period === "pre_christ" ||
      period === "destruction" ||
      period === "post_christ"
  );
}

function normalizePrimaryPeriod(
  primary: unknown,
  periods: ChronologyPeriod[]
): ChronologyPeriod {
  if (
    primary === "jaredite" ||
    primary === "pre_christ" ||
    primary === "destruction" ||
    primary === "post_christ"
  ) {
    return primary;
  }

  if (periods.length > 0) {
    return periods[0];
  }

  return "pre_christ";
}

export function buildGraphNodes(locations: Location[]): GraphNode[] {
  return locations.map((location) => {
    const periods = normalizePeriods(location.chronology?.periods);
    const primaryPeriod = normalizePrimaryPeriod(
      location.chronology?.primary_period,
      periods
    );
    const classification = classifyLocationIntegrity(location);

    return {
      id: location.id,
      label: location.display_name,
      feature_type: location.feature_type,
      chronology_periods: periods,
      primary_period: primaryPeriod,
      overlap_group: location.overlap_group,
      metadata: {
        source_location_id: location.id,
        status: location.status,
        notes: location.notes,

        render_domain: location.render_domain,
        region_scope: location.region_scope,
        map_role: location.map_role,
        visibility_tier: location.visibility_tier,
        certainty_level: location.certainty_level,
        default_render_state: location.default_render_state,
        classification_rationale: location.classification_rationale,
        node_kind: classification.nodeKind,
        evidence_status: classification.evidenceStatus,

        first_reference: location.first_reference,
linked_entities: Array.isArray(location.linked_entities)
  ? location.linked_entities
  : [],
      }
    };
  });
}

export function buildGraphEdges(spatialClaims: SpatialClaim[]): GraphEdge[] {
  return spatialClaims.map((claim) => {
    const periods = normalizePeriods(claim.chronology?.periods);
    const primaryPeriod = normalizePrimaryPeriod(
      claim.chronology?.primary_period,
      periods
    );

    return {
      id: claim.claim_id,
      source: claim.subject_location_id,
      target: claim.object_location_id,
      claim_type: claim.claim_type,
      chronology_periods: periods,
      primary_period: primaryPeriod,
      confidence: claim.confidence,
      reference_id: claim.reference_id,
      toggle_sensitivity: Array.isArray(claim.toggle_sensitivity)
        ? claim.toggle_sensitivity
        : [],
      metadata: {
        claim_basis: claim.claim_basis,
        source_phrase: claim.source_phrase,
        notes: claim.notes
      }
    };
  });
}

export function buildOverlayPaths(
  events: EventRecord[],
  eventSteps: EventStepRecord[]
): OverlayPath[] {
  return events.map((event) => {
    const eventPeriods = normalizePeriods(event.chronology?.periods);
    const eventPrimaryPeriod = normalizePrimaryPeriod(
      event.chronology?.primary_period,
      eventPeriods
    );

    const steps: OverlayPathStep[] = eventSteps
      .filter((step) => step.event_id === event.event_id)
      .sort((a, b) => a.step_order - b.step_order)
      .map((step) => {
        const stepPeriods = normalizePeriods(step.chronology?.periods);
        const stepPrimaryPeriod = normalizePrimaryPeriod(
          step.chronology?.primary_period,
          stepPeriods
        );

        return {
          event_step_id: step.event_step_id,
          from_node_id: step.from_location_id,
          to_node_id: step.to_location_id,
          step_type: step.step_type,
          chronology_periods: stepPeriods,
          primary_period: stepPrimaryPeriod,
          direction_terms: Array.isArray(step.direction_terms)
            ? step.direction_terms
            : [],
          toggle_sensitivity: Array.isArray(step.toggle_sensitivity)
            ? step.toggle_sensitivity
            : [],
          reference_id: step.reference_id,
          notes: step.notes
        };
      });

    return {
      event_id: event.event_id,
      event_name: event.event_name,
      event_type: event.event_type,
      chronology_periods: eventPeriods,
      primary_period: eventPrimaryPeriod,
      steps
    };
  });
}

export function buildGraphDataset(
  locations: Location[],
  spatialClaims: SpatialClaim[],
  events: EventRecord[],
  eventSteps: EventStepRecord[]
): GraphDataset {
  return {
    nodes: buildGraphNodes(locations),
    edges: buildGraphEdges(spatialClaims),
    overlays: buildOverlayPaths(events, eventSteps)
  };
}
