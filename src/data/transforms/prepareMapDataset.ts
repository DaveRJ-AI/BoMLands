import type { ToggleState, ChronologyPeriod } from "../../types/toggles";
import type { GraphDataset } from "../../types/graph";

import { loadCoreData } from "../loaders/loadCoreData";
import { applyToggles } from "./applyToggles";
import { buildGraphDataset } from "./buildGraph";
import { buildRelationalLayout } from "./buildRelationalLayout";

export interface PrepareMapDatasetOptions {
  toggles: ToggleState;
  selectedChronology: ChronologyPeriod[];
  selectedOverlayEventId?: string | null;
  basePath?: string;
}

const ALL_CHRONOLOGY_PERIODS: ChronologyPeriod[] = [
  "jaredite",
  "pre_christ",
  "destruction",
  "post_christ"
];

export async function prepareMapDataset(
  options: PrepareMapDatasetOptions
): Promise<GraphDataset> {
  const { toggles, selectedOverlayEventId, basePath = "/data/core" } = options;

  const coreData = await loadCoreData(basePath);

  // Chronology review is handled later in prepareRenderableMapDataset.
  // Build the full graph first so an empty UI chronology selection can mean
  // "show no periods" without starving the layout stage of all locations.
  const filteredData = applyToggles({
    locations: coreData.locations,
    spatialClaims: coreData.spatialClaims,
    events: coreData.events,
    eventSteps: coreData.eventSteps,
    toggles,
    selectedChronology: ALL_CHRONOLOGY_PERIODS,
    selectedOverlayEventId
  });

  const graphDataset = buildGraphDataset(
    filteredData.locations,
    filteredData.spatialClaims,
    filteredData.events,
    filteredData.eventSteps
  );

  return buildRelationalLayout(graphDataset);
}
