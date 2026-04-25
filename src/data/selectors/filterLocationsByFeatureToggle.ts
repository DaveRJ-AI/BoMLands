import type { Location } from "../../types/location";
import type { IncludeExcludeMode } from "../../types/toggles";

const NATURAL_FEATURE_TYPES = new Set([
  "river",
  "sea",
  "hill",
  "valley",
  "mount",
  "coast",
  "wilderness"
]);

const UNNAMED_STATUS_TYPES = new Set([
  "unnamed",
  "mixed",
  "abstract"
]);

export function filterLocationsByNaturalFeaturesMode(
  locations: Location[],
  naturalFeaturesMode: IncludeExcludeMode
): Location[] {
  if (naturalFeaturesMode === "include") {
    return locations;
  }

  return locations.filter(
    (location) => !NATURAL_FEATURE_TYPES.has(location.feature_type)
  );
}

export function filterLocationsByUnnamedRegionsMode(
  locations: Location[],
  unnamedRegionsMode: IncludeExcludeMode
): Location[] {
  if (unnamedRegionsMode === "include") {
    return locations;
  }

  return locations.filter(
    (location) => !UNNAMED_STATUS_TYPES.has(location.named_status)
  );
}