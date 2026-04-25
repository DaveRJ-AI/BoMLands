import type { SpatialClaim } from "../../types/spatialClaim";

export function getClaimsForLocation(
  spatialClaims: SpatialClaim[],
  locationId: string
): SpatialClaim[] {
  return spatialClaims.filter(
    (claim) =>
      claim.subject_location_id === locationId ||
      claim.object_location_id === locationId
  );
}