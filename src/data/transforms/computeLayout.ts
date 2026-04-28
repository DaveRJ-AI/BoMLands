import type { RenderDataset, RenderableMapObject } from "../../types/render";

import { hasNewWorldManualPositionOverride } from "./buildRelationalLayout";
import { LAYOUT_OVERRIDES } from "./layoutOverrides";

/**
 * Relational layout engine, refinement pass.
 *
 * Goals:
 * - keep the map narrower east-west and longer north-south
 * - stabilize Tier 1 anchors first
 * - reduce marker/label collisions inside the same anchor cluster
 * - spread nearby related objects without losing the overall geography
 */

const DEFAULT_MAP_WIDTH = 1400;
const DEFAULT_MAP_HEIGHT = 1500;
const NEW_WORLD_MAP_WIDTH = 1400;
const NEW_WORLD_MAP_HEIGHT = 2100;
const OLD_WORLD_MAP_WIDTH = 1450;
const OLD_WORLD_MAP_HEIGHT = 1035;

type Preset = {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
};

type RenderDomainName =
  | "new_world_map"
  | "old_world_map"
  | "jaredite_map"
  | "transition";

const NEW_WORLD_POSITION_PRESETS: Record<string, Preset> = {
  "west sea": { x: 160, y: 620 },
  "east sea": { x: 1240, y: 620 },
  "sea north": { x: 700, y: 420 },
  "sea south": { x: 700, y: 860 },

  "land northward": { x: 700, y: 120 },
  desolation: { x: 700, y: 270 },
  bountiful: { x: 700, y: 470 },
  "narrow pass": { x: 700, y: 640 },
  zarahemla: { x: 700, y: 740 },
  sidon: { x: 860, y: 760 },
  jershon: { x: 960, y: 760 },
  manti: { x: 760, y: 930 },
  nephi: { x: 700, y: 1110 },
  "land southward": { x: 700, y: 60 + 1110 },

  "sidon headwaters": { x: 820, y: 890 },
  "first inheritance": { x: 710, y: 1080 },
  "lehi nephi": { x: 740, y: 1050 },
  shilom: { x: 640, y: 1035 },
  shemlon: { x: 560, y: 1015 },
  mormon: { x: 470, y: 945 },
  "waters of mormon": { x: 560, y: 965 },
  helam: { x: 610, y: 900 },
  "north country": { x: 660, y: 500 },
  "temple at bountiful": { x: 770, y: 500 }
};

const OLD_WORLD_POSITION_PRESETS: Record<string, Preset> = {
  jerusalem: { x: 330, y: 213 },
  "jerusalem region": { x: 371, y: 318 },
  "house of lehi": { x: 250, y: 250 },
  "house of laban": { x: 403, y: 223 },
  "laban's treasury": { x: 430, y: 211 },
  "house of ishmael": { x: 232, y: 231 },

  "departure wilderness": { x: 252, y: 362 },
  "red sea": { x: 205, y: 444 },
  "river laman": { x: 252, y: 435 },
  "valley of lemuel": { x: 258, y: 420 },
  shazer: { x: 330, y: 552 },
  "broken bow camp": { x: 447, y: 717 },
  nahom: { x: 538, y: 745 },

  bountiful: { x: 1300, y: 707 },
  "bountiful seashore": { x: 1334, y: 748 },
  "bountiful mountain": { x: 1293, y: 659 },
  "bountiful ore site": { x: 1274, y: 672 },
  "bountiful shipyard": { x: 1326, y: 709 }
};

const JAREDITE_POSITION_PRESETS: Record<string, Preset> = {
  "sea north": { x: 700, y: 150 },
  "land northward": { x: 700, y: 260 },
  "north country": { x: 860, y: 290 },
  "jaredite desolation region": { x: 760, y: 400 },

  moron: { x: 470, y: 230 },
  ablom: { x: 1110, y: 300 },
  "akish wilderness": { x: 350, y: 500 },
  agosh: { x: 520, y: 710 },
  corihor: { x: 670, y: 660 },
  "valley of corihor": { x: 760, y: 820 },
  "valley of shurr": { x: 920, y: 810 },
  comnor: { x: 860, y: 690 },
  ripliancum: { x: 1110, y: 1040 },
  ramah: { x: 860, y: 1120 },
  cumorah: { x: 830, y: 1110 },
  "ramah / cumorah": { x: 830, y: 1110 },
  "dividing sea": { x: 1100, y: 360 }
};

const TRANSITION_POSITION_PRESETS: Record<string, Preset> = {
  "great waters crossing": { x: 700, y: 500 },
  "first landing coast": { x: 930, y: 650 },
  "initial promised land": { x: 1020, y: 760 }
};

const EXACT_POSITION_SOURCE_IDS = new Set<string>([
  "sea_north",
  "land_northward",
  "land_desolation",
  "narrow_pass",
  "west_sea",
  "east_sea",
  "river_sidon",
  "sea_south",
  "wilderness_hermounts",
  "city_aaron",
  "city_gideon",
  "city_zarahemla",
  "city_nephihah",
  "land_nephihah",
  "city_lehi",
  "land_lehi",
  "city_morianton",
  "land_morianton",
  "city_omner",
  "land_omner",
  "city_gid",
  "land_gid",
  "land_gideon",
  "valley_gideon",
  "land_jershon",
  "city_mulek",
  "land_mulek",
  "land_ishmael",
  "land_midoni",
  "south_sidon_wilderness",
  "land_melek",
  "land_ammonihah",
  "city_ammonihah",
  "land_noah",
  "city_noah",
  "city_sidom",
  "city_zeezrom",
  "land_manti",
  "city_cumeni",
  "city_judea",
  "bountiful_coastal_camp",
  "first_landing",
  "land_southward",
  "land_bountiful",
  "city_bountiful",
  "manti_headwaters",
  "antionum_region",
  "land_first_inheritance",
  "temple_bountiful",
  "north_country",
  "seashore_mulek",
  "wilderness_zarahemla_border",
]);

function normalizeText(value: string | undefined | null): string {
  return (value ?? "")
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function getSearchText(object: RenderableMapObject): string {
  return normalizeText(
    [
      object.id,
      object.sourceId,
      object.sourceType,
      object.shapeType,
      object.renderLayer,
      object.featureType,
      object.style.label,
      object.metadata?.displayName,
      object.metadata?.notes,
      object.metadata?.regionScope,
      object.metadata?.mapRole,
      object.metadata?.renderDomain
    ]
      .filter(Boolean)
      .join(" ")
  );
}

function getRenderDomain(object: RenderableMapObject): RenderDomainName {
  const domain = object.metadata?.renderDomain;
  if (
    domain === "new_world_map" ||
    domain === "old_world_map" ||
    domain === "jaredite_map" ||
    domain === "transition"
  ) {
    return domain;
  }
  return "new_world_map";
}

function getVisibilityTier(object: RenderableMapObject): string {
  return object.metadata?.visibilityTier ?? "tier_2_major";
}

function getMapRole(object: RenderableMapObject): string {
  return object.metadata?.mapRole ?? "";
}

function getPresetTableForDomain(
  domain: RenderDomainName
): Record<string, Preset> {
  switch (domain) {
    case "old_world_map":
      return OLD_WORLD_POSITION_PRESETS;
    case "jaredite_map":
      return JAREDITE_POSITION_PRESETS;
    case "transition":
      return TRANSITION_POSITION_PRESETS;
    case "new_world_map":
    default:
      return NEW_WORLD_POSITION_PRESETS;
  }
}

function getDomainBaseCenter(domain: RenderDomainName): { x: number; y: number } {
  switch (domain) {
    case "old_world_map":
      return { x: 760, y: 520 };
    case "jaredite_map":
      return { x: 760, y: 560 };
    case "transition":
      return { x: 760, y: 560 };
    case "new_world_map":
    default:
      return { x: 700, y: 760 };
  }
}

function getDomainDimensions(domain: RenderDomainName): { width: number; height: number } {
  switch (domain) {
    case "new_world_map":
      return { width: NEW_WORLD_MAP_WIDTH, height: NEW_WORLD_MAP_HEIGHT };
    case "old_world_map":
      return { width: OLD_WORLD_MAP_WIDTH, height: OLD_WORLD_MAP_HEIGHT };
    case "jaredite_map":
    case "transition":
    default:
      return { width: DEFAULT_MAP_WIDTH, height: DEFAULT_MAP_HEIGHT };
  }
}

function findPresetKey(object: RenderableMapObject): string | null {
  const searchText = getSearchText(object);
  const presetTable = getPresetTableForDomain(getRenderDomain(object));
  const orderedKeys = Object.keys(presetTable).sort(
    (a, b) => normalizeText(b).length - normalizeText(a).length
  );

  for (const key of orderedKeys) {
    if (searchText.includes(key)) {
      return key;
    }
  }

  return null;
}

function findPreset(object: RenderableMapObject): Preset | null {
  const layoutKey = object.metadata?.layoutKey;
  if (layoutKey && LAYOUT_OVERRIDES[layoutKey]) {
    return LAYOUT_OVERRIDES[layoutKey];
  }

  const presetKey = findPresetKey(object);
  if (!presetKey) return null;

  const presetTable = getPresetTableForDomain(getRenderDomain(object));
  return presetTable[presetKey] ?? null;
}

function buildFallbackGridPosition(
  object: RenderableMapObject,
  index: number
): { x: number; y: number } {
  const domain = getRenderDomain(object);
  const columns = 4;
  const column = index % columns;
  const row = Math.floor(index / columns);
  const base = getDomainBaseCenter(domain);

  return {
    x: base.x - 240 + column * 160,
    y: base.y - 320 + row * 120
  };
}

function inferPositionFromText(
  object: RenderableMapObject,
  baseX: number,
  baseY: number
): { x: number; y: number } {
  const text = getSearchText(object);
  const mapRole = getMapRole(object);

  let x = baseX;
  let y = baseY;

  if (text.includes("northward")) y -= 260;
  if (text.includes("southward")) y += 260;

  if (text.includes("north")) y -= 80;
  if (text.includes("south")) y += 80;
  if (text.includes("east")) x += 110;
  if (text.includes("west")) x -= 110;

  if (text.includes("headwaters")) y -= 90;
  if (text.includes("wilderness")) x += 70;
  if (text.includes("border")) x += 75;

  if (mapRole === "water_boundary") {
    if (text.includes("west sea")) x = 160;
    if (text.includes("east sea")) x = 1240;
    if (text.includes("sea north")) y = 420;
    if (text.includes("sea south")) y = 860;
  }

  return { x, y };
}

function getClusterRadius(object: RenderableMapObject): number {
  switch (getVisibilityTier(object)) {
    case "tier_1_anchor":
      return 0;
    case "tier_2_major":
      return 20;
    case "tier_3_supporting":
      return 34;
    case "tier_4_detail":
      return 46;
    default:
      return 24;
  }
}

function getRoleOffsetIndex(object: RenderableMapObject): number {
  const mapRole = getMapRole(object);
  const featureType = object.featureType;

  if (mapRole === "macro_region") return 0;
  if (mapRole === "region_underlay" || featureType === "land" || featureType === "region") {
    return 1;
  }
  if (mapRole === "water_boundary" || featureType === "sea" || featureType === "river") {
    return 2;
  }
  if (mapRole === "gateway") return 3;
  if (mapRole === "landmark_node") return 4;
  if (mapRole === "city_node" || featureType === "city") return 5;
  return 6;
}

function getClusterOffset(
  object: RenderableMapObject,
  clusterIndex: number
): { dx: number; dy: number } {
  const radius = getClusterRadius(object);
  const roleIndex = getRoleOffsetIndex(object);
  const index = clusterIndex + roleIndex;

  if (radius === 0) {
    return { dx: 0, dy: 0 };
  }

  const positions = [
    { dx: radius, dy: 0 },
    { dx: -radius, dy: 0 },
    { dx: 0, dy: radius },
    { dx: 0, dy: -radius },
    { dx: radius * 0.8, dy: radius * 0.8 },
    { dx: -radius * 0.8, dy: radius * 0.8 },
    { dx: radius * 0.8, dy: -radius * 0.8 },
    { dx: -radius * 0.8, dy: -radius * 0.8 }
  ];

  return positions[index % positions.length];
}

function computeAnchorKey(object: RenderableMapObject): string {
  const presetKey = findPresetKey(object);
  if (presetKey) return `${getRenderDomain(object)}::${presetKey}`;

  const searchText = getSearchText(object);
  const mapRole = getMapRole(object);

  if (searchText.includes("zarahemla")) return `${getRenderDomain(object)}::zarahemla_cluster`;
  if (searchText.includes("manti")) return `${getRenderDomain(object)}::manti_cluster`;
  if (searchText.includes("nephi")) return `${getRenderDomain(object)}::nephi_cluster`;
  if (searchText.includes("bountiful")) return `${getRenderDomain(object)}::bountiful_cluster`;
  if (searchText.includes("jerusalem")) return `${getRenderDomain(object)}::jerusalem_cluster`;
  if (searchText.includes("ramah") || searchText.includes("cumorah")) {
    return `${getRenderDomain(object)}::ramah_cluster`;
  }

  return `${getRenderDomain(object)}::${mapRole || "generic"}::${Math.round((object.geometry.x ?? 0) / 100)}`;
}

function computeObjectLayoutBase(
  object: RenderableMapObject,
  index: number
): { x: number; y: number } {
  // Highest priority: precomputed relational coordinates
  if (typeof object.geometry.x === "number" && typeof object.geometry.y === "number") {
    return {
      x: object.geometry.x,
      y: object.geometry.y
    };
  }

  const preset = findPreset(object);
  const domain = getRenderDomain(object);
  const base = getDomainBaseCenter(domain);
  const inferred = inferPositionFromText(object, base.x, base.y);
  const grid = buildFallbackGridPosition(object, index);

  return {
    x: preset?.x ?? inferred.x ?? grid.x,
    y: preset?.y ?? inferred.y ?? grid.y
  };
}

function shouldUseExactPlacement(object: RenderableMapObject): boolean {
  return (
    getRenderDomain(object) === "old_world_map" ||
    EXACT_POSITION_SOURCE_IDS.has(object.sourceId) ||
    (getRenderDomain(object) === "new_world_map" &&
      hasNewWorldManualPositionOverride(object.sourceId))
  );
}

function withPositionedPoint(
  object: RenderableMapObject,
  x: number,
  y: number
): RenderableMapObject {
  return {
    ...object,
    geometry: {
      ...object.geometry,
      x,
      y
    }
  };
}

export function computeLayout(renderDataset: RenderDataset): RenderDataset {
  const safeObjects = Array.isArray(renderDataset.objects) ? renderDataset.objects : [];

  const clusterCounts = new Map<string, number>();
  const positionedLocationAnchors = new Map<string, { x: number; y: number }>();

  const objects = safeObjects.map((object, index) => {
    const base = computeObjectLayoutBase(object, index);
    const domain = getRenderDomain(object);
    const dimensions = getDomainDimensions(domain);
    const anchorKey = computeAnchorKey(object);
    const clusterIndex = clusterCounts.get(anchorKey) ?? 0;
    clusterCounts.set(anchorKey, clusterIndex + 1);

    const offset = shouldUseExactPlacement(object)
      ? { dx: 0, dy: 0 }
      : getClusterOffset(object, clusterIndex);

    const x = clamp(base.x + offset.dx, 30, dimensions.width - 30);
    const y = clamp(base.y + offset.dy, 30, dimensions.height - 30);

    if (object.sourceType === "event_step") {
      const fromNodeId = object.metadata?.fromNodeId;
      const toNodeId = object.metadata?.toNodeId;

      if (fromNodeId && toNodeId) {
        const fromAnchor = positionedLocationAnchors.get(fromNodeId);
        const toAnchor = positionedLocationAnchors.get(toNodeId);

        if (fromAnchor && toAnchor) {
          const midpointX = (fromAnchor.x + toAnchor.x) / 2;
          const midpointY = (fromAnchor.y + toAnchor.y) / 2;

          return {
            ...object,
            geometry: {
              ...object.geometry,
              x: midpointX,
              y: midpointY,
              x2: toAnchor.x,
              y2: toAnchor.y,
              points: [fromAnchor, toAnchor]
            }
          };
        }
      }
    }

    if (object.shapeType === "line") {
      return {
        ...object,
        geometry: {
          ...object.geometry,
          x,
          y,
          x2: object.geometry.x2 ?? x + 80,
          y2: object.geometry.y2 ?? y + 40,
          points:
            object.geometry.points ??
            [
              { x, y },
              { x: x + 80, y: y + 40 }
            ]
        }
      };
    }

    const positionedObject = withPositionedPoint(object, x, y);

    if (object.sourceType === "location" && object.shapeType === "point") {
      positionedLocationAnchors.set(object.sourceId, { x, y });
    }

    return positionedObject;
  });

  return { objects };
}
