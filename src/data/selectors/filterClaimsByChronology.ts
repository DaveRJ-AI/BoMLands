import type { SpatialClaim } from "../../types/spatialClaim";
import type { ChronologyPeriod } from "../../types/toggles";

export function filterClaimsByChronology(
  spatialClaims: SpatialClaim[],
  selectedPeriods: ChronologyPeriod[]
): SpatialClaim[] {
  if (selectedPeriods.length === 0) {
    return [];
  }

  return spatialClaims.filter((claim) =>
    claim.chronology.periods.some((period) => selectedPeriods.includes(period))
  );
}
