import type { Location } from "../../types/location";
import type { ChronologyPeriod } from "../../types/toggles";

export function filterLocationsByChronology(
  locations: Location[],
  selectedPeriods: ChronologyPeriod[]
): Location[] {
  if (selectedPeriods.length === 0) {
    return locations;
  }

  return locations.filter((location) =>
    location.chronology.periods.some((period) => selectedPeriods.includes(period))
  );
}