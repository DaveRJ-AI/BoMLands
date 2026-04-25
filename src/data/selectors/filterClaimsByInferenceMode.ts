import type { SpatialClaim } from "../../types/spatialClaim";
import type { InferenceMode } from "../../types/toggles";

export function filterClaimsByInferenceMode(
  spatialClaims: SpatialClaim[],
  inferenceMode: InferenceMode
): SpatialClaim[] {
  switch (inferenceMode) {
    case "explicit_only":
      return spatialClaims.filter((claim) => claim.claim_basis === "explicit");

    case "explicit_plus_strong":
      return spatialClaims.filter(
        (claim) =>
          claim.claim_basis === "explicit" ||
          claim.claim_basis === "strong_inference"
      );

    case "all":
    default:
      return spatialClaims;
  }
}