import type { Location } from "../../types/location";

export function getLocationById(
  locations: Location[],
  locationId: string
): Location | undefined {
  return locations.find((location) => location.id === locationId);
}