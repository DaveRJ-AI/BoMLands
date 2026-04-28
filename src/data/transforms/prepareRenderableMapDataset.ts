import type {
  ToggleState,
  ChronologyPeriod,
  RenderDomain
} from "../../types/toggles";
import type { RenderDataset, RenderableMapObject } from "../../types/render";

import { prepareMapDataset } from "./prepareMapDataset";
import { buildRenderableMapObjects } from "./buildRenderableMapObjects";
import { computeLayout } from "./computeLayout";

export interface TierVisibilityFilters {
  tier1: boolean;
  tier2: boolean;
  tier3: boolean;
  tier4: boolean;
  tier5: boolean;
}

export interface CategoryVisibilityFilters {
  cities: boolean;
  lands: boolean;
  waters: boolean;
  landmarks: boolean;
}

export interface PrepareRenderableMapDatasetOptions {
  toggles: ToggleState;
  selectedChronology: ChronologyPeriod[];
  selectedRenderDomain: RenderDomain;
  tierFilters: TierVisibilityFilters;
  categoryFilters: CategoryVisibilityFilters;
  selectedOverlayEventId?: string | null;
  basePath?: string;
}

function matchesChronology(
  object: RenderableMapObject,
  selectedChronology: ChronologyPeriod[]
): boolean {
  if (!Array.isArray(selectedChronology) || selectedChronology.length === 0) {
    return false;
  }

  const periods = Array.isArray(object.chronologyPeriods)
    ? object.chronologyPeriods
    : [];

  if (periods.length === 0) {
    return true;
  }

  return periods.some((period) => selectedChronology.includes(period));
}

function matchesRenderDomain(
  object: RenderableMapObject,
  selectedRenderDomain: RenderDomain
): boolean {
  const objectDomain = object.metadata?.renderDomain;

  if (!objectDomain) {
    return true;
  }

  return objectDomain === selectedRenderDomain;
}

function getTierKey(object: RenderableMapObject): keyof TierVisibilityFilters {
  const tier = object.metadata?.visibilityTier;

  switch (tier) {
    case "tier_1_anchor":
      return "tier1";
    case "tier_2_major":
      return "tier2";
    case "tier_3_supporting":
      return "tier3";
    case "tier_4_detail":
      return "tier4";
    case "tier_5_placeholder":
      return "tier5";
    default:
      return "tier2";
  }
}

function matchesTierFilters(
  object: RenderableMapObject,
  tierFilters: TierVisibilityFilters
): boolean {
  if (
    object.renderLayer === "background" ||
    object.shapeType === "underlay_asset"
  ) {
    return true;
  }

  return tierFilters[getTierKey(object)];
}

function getCategoryKey(
  object: RenderableMapObject
): keyof CategoryVisibilityFilters {
  const mapRole = object.metadata?.mapRole;
  const featureType = object.featureType;

  if (mapRole === "city_node" || featureType === "city") {
    return "cities";
  }

  if (
    mapRole === "water_boundary" ||
    featureType === "sea" ||
    featureType === "river"
  ) {
    return "waters";
  }

  if (
    mapRole === "macro_region" ||
    mapRole === "region_underlay" ||
    featureType === "land" ||
    featureType === "region" ||
    featureType === "border_region"
  ) {
    return "lands";
  }

  return "landmarks";
}

function matchesCategoryFilters(
  object: RenderableMapObject,
  categoryFilters: CategoryVisibilityFilters
): boolean {
  if (object.renderLayer === "background") {
    return true;
  }

  return categoryFilters[getCategoryKey(object)];
}

function matchesDefaultRenderState(
  object: RenderableMapObject,
  selectedChronology: ChronologyPeriod[]
): boolean {
  const renderState = object.metadata?.defaultRenderState ?? "visible";

  switch (renderState) {
    case "hidden":
      return false;

    case "chronology_only":
      return (
        Array.isArray(selectedChronology) &&
        selectedChronology.length > 0 &&
        matchesChronology(object, selectedChronology)
      );

    case "detail_only":
      return true;

    case "visible":
    default:
      return true;
  }
}

function filterRenderDataset(
  dataset: RenderDataset,
  selectedChronology: ChronologyPeriod[],
  selectedRenderDomain: RenderDomain,
  tierFilters: TierVisibilityFilters,
  categoryFilters: CategoryVisibilityFilters
): RenderDataset {
  const safeObjects = Array.isArray(dataset.objects) ? dataset.objects : [];

  const objects = safeObjects.filter((object) => {
    return (
      matchesRenderDomain(object, selectedRenderDomain) &&
      matchesDefaultRenderState(object, selectedChronology) &&
      matchesChronology(object, selectedChronology) &&
      matchesTierFilters(object, tierFilters) &&
      matchesCategoryFilters(object, categoryFilters)
    );
  });

  return { objects };
}

export async function prepareRenderableMapDataset(
  options: PrepareRenderableMapDatasetOptions
): Promise<RenderDataset> {
  const graphDataset = await prepareMapDataset(options);
  const renderDataset = buildRenderableMapObjects(graphDataset);
  const laidOutDataset = computeLayout(renderDataset);

  return filterRenderDataset(
    laidOutDataset,
    options.selectedChronology,
    options.selectedRenderDomain,
    options.tierFilters,
    options.categoryFilters
  );
}
