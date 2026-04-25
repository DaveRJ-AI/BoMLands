import type {
  Location,
  LocationEvidenceStatus,
  LocationNodeKind
} from "../../types/location";

export interface LocationIntegrityMetrics {
  references?: number;
  claims?: number;
}

export interface LocationIntegrityClassification {
  nodeKind: LocationNodeKind;
  evidenceStatus: LocationEvidenceStatus;
}

function getNodeKindFallback(location: Location): LocationNodeKind {
  if (location.named_status === "abstract") {
    return "analytical_construct";
  }

  if (
    location.map_role === "macro_region" &&
    location.certainty_level === "normalized" &&
    /abstract|aggregate|overlay/i.test(
      `${location.notes ?? ""} ${location.classification_rationale ?? ""}`
    )
  ) {
    return "analytical_construct";
  }

  if (
    location.named_status === "unnamed" ||
    location.named_status === "mixed" ||
    location.certainty_level === "normalized" ||
    location.certainty_level === "inferred"
  ) {
    return "derived_overlay";
  }

  return "source_location";
}

export function deriveLocationNodeKind(location: Location): LocationNodeKind {
  return location.node_kind ?? getNodeKindFallback(location);
}

export function deriveLocationEvidenceStatus(
  location: Location,
  metrics: LocationIntegrityMetrics = {}
): LocationEvidenceStatus {
  if (location.evidence_status) {
    return location.evidence_status;
  }

  const nodeKind = deriveLocationNodeKind(location);
  if (nodeKind === "analytical_construct") {
    return "analytical_abstract";
  }

  const references = metrics.references;
  const claims = metrics.claims;

  if (typeof references === "number" && typeof claims === "number") {
    if (references === 0 || claims === 0) {
      return "coverage_review_needed";
    }
  } else if (typeof references === "number" && references === 0) {
    return "coverage_review_needed";
  }

  if (
    nodeKind === "derived_overlay" ||
    location.certainty_level === "normalized" ||
    location.certainty_level === "inferred" ||
    location.certainty_level === "provisional"
  ) {
    return "inference_supported";
  }

  return "source_grounded";
}

export function classifyLocationIntegrity(
  location: Location,
  metrics: LocationIntegrityMetrics = {}
): LocationIntegrityClassification {
  return {
    nodeKind: deriveLocationNodeKind(location),
    evidenceStatus: deriveLocationEvidenceStatus(location, metrics)
  };
}
