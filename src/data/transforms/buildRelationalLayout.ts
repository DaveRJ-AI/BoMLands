import type { GraphDataset, GraphNode } from "../../types/graph";

type NodeMap = Map<string, GraphNode>;

type AnchorPosition = {
  x: number;
  y: number;
};

type RelativeRule = {
  sourceId: string;
  targetId: string;
  dx?: number;
  dy?: number;
};

const NEW_WORLD_HORIZONTAL_SHIFT = 140;
const NEW_WORLD_DOWNWARD_SHIFT = 315;

const NEW_WORLD_MANUAL_POSITION_OVERRIDES: Record<string, AnchorPosition> = {
  sea_north: { x: 692, y: 53 },
  land_northward: { x: 616, y: 334 },
  land_desolation: { x: 723, y: 587 },
  narrow_pass: { x: 777, y: 663 },
  west_sea: { x: 267, y: 851 },
  east_sea: { x: 1258, y: 851 },
  river_sidon: { x: 1003, y: 1162 },
  sea_south: { x: 769, y: 2053 },
  wilderness_hermounts: { x: 663, y: 914 },
  hill_amnihu: { x: 1049, y: 1090 },
  city_moroni: { x: 1322, y: 1303 },
  city_aaron: { x: 1225, y: 1160 },
  city_nephihah: { x: 1252, y: 1239 },
  city_lehi: { x: 1162, y: 1126 },
  city_morianton: { x: 1132, y: 1060 },
  city_omner: { x: 1093, y: 1023 },
  city_gid: { x: 1052, y: 1016 },
  city_gideon: { x: 1042, y: 1172 },
  land_jershon: { x: 1007, y: 1022 },
  city_mulek: { x: 1010, y: 955 },
  land_mulek: { x: 912, y: 1133 },
  mulekite_zarahemla_region: { x: 880, y: 1153 },
  land_nephihah: { x: 1221, y: 1242 },
  land_morianton: { x: 1108, y: 1074 },
  land_omner: { x: 1067, y: 1032 },
  land_gid: { x: 1046, y: 1034 },
  land_lehi: { x: 1143, y: 1138 },
  land_southward: { x: 742, y: 861 },
  land_bountiful: { x: 842, y: 923 },
  city_bountiful: { x: 880, y: 955 },
  city_zarahemla: { x: 919, y: 1101 },
  manti_headwaters: { x: 889, y: 1371 },
  antionum_region: { x: 1066, y: 1123 },
  land_first_inheritance: { x: 506, y: 1820 },
  first_landing: { x: 979, y: 2046 },
  temple_bountiful: { x: 877, y: 976 },
  north_country: { x: 663, y: 484 },
  seashore_mulek: { x: 1020, y: 966 },
  wilderness_zarahemla_border: { x: 1032, y: 1291 },
  river_sidon_crossing_zone: { x: 987, y: 1185 },
  land_midoni: { x: 1049, y: 1439 },
  land_ishmael: { x: 1008, y: 1483 },
  valley_gideon: { x: 1040, y: 1162 },
  land_gideon: { x: 1026, y: 1175 },
  south_sidon_wilderness: { x: 996, y: 1214 },
  land_ammonihah: { x: 1083, y: 1164 },
  city_ammonihah: { x: 1067, y: 1143 },
  land_noah: { x: 1141, y: 1156 },
  city_noah: { x: 1094, y: 1137 },
  city_zeezrom: { x: 875, y: 1320 },
  land_manti: { x: 992, y: 1331 },
  city_cumeni: { x: 826, y: 1316 },
  city_judea: { x: 807, y: 1266 },
  city_antiparah: { x: 746, y: 1296 },
  land_antiparah: { x: 727, y: 1280 },
  city_jerusalem: { x: 506, y: 1513 },
  lamanite_regions_general: { x: 726, y: 1410 },
  land_melek: { x: 957, y: 1199 },
  place_mormon: { x: 645, y: 1404 },
  city_sidom: { x: 1003, y: 1092 },
  bountiful_coastal_camp: { x: 1028, y: 918 },
  multiple_lamanite_lands: { x: 701, y: 1391 }
};

export function hasNewWorldManualPositionOverride(sourceId: string): boolean {
  return Object.prototype.hasOwnProperty.call(
    NEW_WORLD_MANUAL_POSITION_OVERRIDES,
    sourceId
  );
}

const NEW_WORLD_TIER1_ANCHORS: Record<string, AnchorPosition> = {
  west_sea: { x: 140, y: 760 },
  east_sea: { x: 1260, y: 760 },

  sea_north: { x: 850, y: 220 },
  sea_south: { x: 500, y: 1400 },

  land_northward: { x: 700, y: 120 },
  land_desolation: { x: 700, y: 285 },
  land_bountiful: { x: 700, y: 540 },

  narrow_pass: { x: 700, y: 430 },

  land_zarahemla: { x: 700, y: 760 },
  river_sidon: { x: 850, y: 790 },

  land_manti: { x: 770, y: 1010 },
  land_nephi: { x: 700, y: 1290 },
  land_southward: { x: 700, y: 1410 }
};

/**
 * First relational pass for New World only.
 *
 * Philosophy:
 * - Lock Tier 1 anchors first.
 * - Place major city/landmark nodes relative to those anchors.
 * - Leave Old World / Jaredite on preset mode for now.
 */
const NEW_WORLD_RELATIVE_RULES: RelativeRule[] = [
  // Tier 2 major cities relative to Tier 1 lands
  { sourceId: "land_bountiful", targetId: "city_bountiful", dx: 24, dy: 26 },
  { sourceId: "land_zarahemla", targetId: "city_zarahemla", dx: 34, dy: 18 },
  { sourceId: "land_manti", targetId: "city_manti", dx: 26, dy: 24 },
  { sourceId: "land_nephi", targetId: "city_nephi", dx: 34, dy: 18 },

  // Bountiful / northern corridor
  { sourceId: "land_bountiful", targetId: "temple_bountiful", dx: 62, dy: 8 },
  { sourceId: "city_bountiful", targetId: "city_bountiful_post", dx: 18, dy: -14 },
  { sourceId: "city_bountiful_post", targetId: "temple_bountiful", dx: 20, dy: -6 },
  { sourceId: "land_bountiful", targetId: "north_country", dx: -84, dy: -126 },
  { sourceId: "land_bountiful", targetId: "land_jershon", dx: 450, dy: 122 },
  { sourceId: "land_jershon", targetId: "city_mulek", dx: -10, dy: 148 },
  { sourceId: "city_mulek", targetId: "city_gid", dx: -4, dy: 36 },
  { sourceId: "city_gid", targetId: "city_omner", dx: -4, dy: 34 },
  { sourceId: "city_omner", targetId: "city_morianton", dx: 10, dy: 72 },
  { sourceId: "city_morianton", targetId: "city_lehi", dx: 8, dy: 54 },
  { sourceId: "city_lehi", targetId: "city_nephihah", dx: 4, dy: 32 },
  { sourceId: "city_nephihah", targetId: "city_aaron", dx: -86, dy: -18 },
  { sourceId: "city_nephihah", targetId: "land_nephihah", dx: -28, dy: -18 },
  { sourceId: "city_lehi", targetId: "land_lehi", dx: -24, dy: -18 },
  { sourceId: "city_omner", targetId: "land_omner", dx: -24, dy: -18 },
  { sourceId: "city_gid", targetId: "land_gid", dx: -24, dy: -18 },
  { sourceId: "city_nephihah", targetId: "city_moroni", dx: 74, dy: 74 },
  { sourceId: "city_moroni", targetId: "city_moroni_destruction", dx: 18, dy: -18 },
  { sourceId: "city_moroni_destruction", targetId: "great_deep_moroni", dx: 28, dy: 24 },
  { sourceId: "city_mulek", targetId: "seashore_mulek", dx: 82, dy: -12 },

  // Zarahemla cluster
  // Zarahemla Tier 3
  { sourceId: "city_zarahemla", targetId: "temple_zarahemla", dx: 26, dy: 8 },
  { sourceId: "city_zarahemla", targetId: "tower_nephi_garden", dx: 42, dy: -22 },
{ sourceId: "land_zarahemla", targetId: "east_wilderness_zarahemla", dx: 148, dy: -18 },
{ sourceId: "river_sidon", targetId: "land_melek", dx: -198, dy: -28 },
{ sourceId: "land_melek", targetId: "land_ammonihah", dx: 18, dy: -138 },
{ sourceId: "land_ammonihah", targetId: "city_ammonihah", dx: 20, dy: 14 },
{ sourceId: "city_ammonihah", targetId: "land_sidom", dx: 92, dy: 68 },
{ sourceId: "land_sidom", targetId: "city_sidom", dx: 22, dy: 18 },
{ sourceId: "land_ammonihah", targetId: "land_noah", dx: 92, dy: -24 },
{ sourceId: "land_noah", targetId: "city_noah", dx: 18, dy: 14 },
{ sourceId: "land_zarahemla", targetId: "wilderness_hermounts", dx: -252, dy: -154 },
{ sourceId: "river_sidon", targetId: "hill_amnihu", dx: 96, dy: -44 },

  // Sidon / Manti relationship
  { sourceId: "river_sidon", targetId: "manti_headwaters", dx: 120, dy: 56 },
  { sourceId: "land_manti", targetId: "manti_headwaters", dx: -54, dy: -52 },

// Southern homeland cluster
{ sourceId: "land_nephi", targetId: "land_first_inheritance", dx: -285, dy: -18 },
{ sourceId: "land_nephi", targetId: "land_lehi_nephi", dx: 44, dy: -6 },
{ sourceId: "land_lehi_nephi", targetId: "city_lehi_nephi", dx: 24, dy: 16 },
{ sourceId: "land_nephi", targetId: "land_shilom", dx: -88, dy: -28 },
{ sourceId: "land_shilom", targetId: "city_shilom", dx: 18, dy: 14 },
{ sourceId: "land_shilom", targetId: "land_shemlon", dx: -62, dy: -110 },

// Mormon / Helam refuge zone
{ sourceId: "land_nephi", targetId: "place_mormon", dx: -168, dy: -126 },
{ sourceId: "place_mormon", targetId: "waters_mormon", dx: 42, dy: 18 },
{ sourceId: "place_mormon", targetId: "land_helam", dx: 108, dy: -72 },
{ sourceId: "land_helam", targetId: "city_helam", dx: 22, dy: 16 },

// Tier 3 central / southern / eastern area
{ sourceId: "land_helam", targetId: "city_hethumeni", dx: 34, dy: 34 },

{ sourceId: "river_sidon", targetId: "valley_gideon", dx: 116, dy: 136 },
{ sourceId: "valley_gideon", targetId: "land_gideon", dx: 18, dy: -34 },
{ sourceId: "land_gideon", targetId: "city_gideon", dx: -6, dy: 58 },

{ sourceId: "place_mormon", targetId: "city_jerusalem", dx: -72, dy: 12 },

{ sourceId: "land_nephi", targetId: "land_minon", dx: 92, dy: -64 },
{ sourceId: "city_morianton", targetId: "land_morianton", dx: -42, dy: -18 },

{ sourceId: "city_nephi", targetId: "temple_nephi", dx: 34, dy: 6 },

// Manti theater / transition zone
{ sourceId: "land_manti", targetId: "city_cumeni", dx: -28, dy: 116 },
{ sourceId: "city_cumeni", targetId: "city_antiparah", dx: -96, dy: 42 },
{ sourceId: "city_antiparah", targetId: "city_judea", dx: 158, dy: -8 },

{ sourceId: "city_mulek", targetId: "land_mulek", dx: -34, dy: -14 },
{ sourceId: "city_judea", targetId: "land_judea", dx: -30, dy: -16 },
{ sourceId: "city_cumeni", targetId: "land_cumeni", dx: -28, dy: -18 },
{ sourceId: "city_antiparah", targetId: "land_antiparah", dx: -30, dy: -16 },

// Tier 3 Eastern Zarahemla cluster
{ sourceId: "river_sidon", targetId: "land_ishmael", dx: 150, dy: 18 },
{ sourceId: "land_ishmael", targetId: "land_midoni", dx: 38, dy: 88 },
{ sourceId: "land_ishmael", targetId: "city_antionum", dx: -112, dy: 108 },
{ sourceId: "city_antionum", targetId: "antionum_region", dx: -24, dy: -22 },
{ sourceId: "land_manti", targetId: "south_sidon_wilderness", dx: 126, dy: 72 },
{ sourceId: "south_sidon_wilderness", targetId: "wilderness_south_sidon", dx: -18, dy: 18 },

// Tier 4 Zarahemla / southern-route attachments
{ sourceId: "land_shilom", targetId: "hill_north_of_shilom", dx: -12, dy: -110 },
{ sourceId: "land_helam", targetId: "land_amulon", dx: 62, dy: 84 },
{ sourceId: "city_zarahemla", targetId: "temple_zarahemla", dx: 28, dy: 8 },
{ sourceId: "land_helam", targetId: "valley_alma", dx: 42, dy: -132 }, 
{ sourceId: "land_zarahemla", targetId: "tower_benjamin", dx: 42, dy: 16 },

// Tier 4 Zarahemla / Sidon corridor refinement
{ sourceId: "land_zarahemla", targetId: "manti_supply_corridor", dx: 28, dy: 154 },
{ sourceId: "river_sidon", targetId: "river_sidon_crossing_zone", dx: 58, dy: 96 },
{ sourceId: "city_antiparah", targetId: "southern_wilderness_route", dx: -82, dy: 62 },
{ sourceId: "land_zarahemla", targetId: "wilderness_zarahemla_border", dx: 54, dy: 156 },

{ sourceId: "land_zarahemla", targetId: "mulekite_zarahemla_region", dx: -8, dy: 330 },
{ sourceId: "land_bountiful", targetId: "bountiful_coastal_camp", dx: 330, dy: 78 }
];

function cloneNode(node: GraphNode): GraphNode {
  return {
    ...node,
    metadata: node.metadata ? { ...node.metadata } : undefined
  };
}

function getRenderDomain(node: GraphNode): string {
  return node.metadata?.render_domain ?? "new_world_map";
}

function getVisibilityTier(node: GraphNode): string {
  return node.metadata?.visibility_tier ?? "tier_2_major";
}

function isNewWorldNode(node: GraphNode): boolean {
  return getRenderDomain(node) === "new_world_map";
}

function isTier1Anchor(node: GraphNode): boolean {
  return getVisibilityTier(node) === "tier_1_anchor";
}

function setNodePosition(nodeMap: NodeMap, id: string, x: number, y: number): void {
  const node = nodeMap.get(id);
  if (!node) return;

  node.x = x;
  node.y = y;
}

function applyTier1Anchors(nodeMap: NodeMap): void {
  for (const [id, position] of Object.entries(NEW_WORLD_TIER1_ANCHORS)) {
    setNodePosition(nodeMap, id, position.x, position.y);
  }
}

function applyRelativeRules(nodeMap: NodeMap): void {
  for (const rule of NEW_WORLD_RELATIVE_RULES) {
    const source = nodeMap.get(rule.sourceId);
    const target = nodeMap.get(rule.targetId);

    if (!source || !target) continue;
    if (typeof source.x !== "number" || typeof source.y !== "number") continue;

    target.x = source.x + (rule.dx ?? 0);
    target.y = source.y + (rule.dy ?? 0);
  }
}

function applyTierBasedFallbacks(nodeMap: NodeMap): void {
  const newWorldNodes = [...nodeMap.values()].filter(isNewWorldNode);

  const tier1 = newWorldNodes.filter(
    (node) => isTier1Anchor(node) && typeof node.x === "number" && typeof node.y === "number"
  );

  const fallbackCenterX = 700;
  const fallbackCenterY = 760;

  let unresolvedIndex = 0;

  for (const node of newWorldNodes) {
    if (typeof node.x === "number" && typeof node.y === "number") {
      continue;
    }

    const tier = getVisibilityTier(node);

    // Tier 2 nodes cluster around the central spine.
    if (tier === "tier_2_major") {
      const offsets = [
        { dx: -140, dy: -120 },
        { dx: 140, dy: -120 },
        { dx: -120, dy: 40 },
        { dx: 120, dy: 40 },
        { dx: -90, dy: 170 },
        { dx: 90, dy: 170 }
      ];

      const offset = offsets[unresolvedIndex % offsets.length];
      node.x = fallbackCenterX + offset.dx;
      node.y = fallbackCenterY + offset.dy;
      unresolvedIndex += 1;
      continue;
    }

    // Tier 3 / Tier 4 nodes stay near the center for now,
    // to be refined later from claims and neighborhood logic.
    const column = unresolvedIndex % 4;
    const row = Math.floor(unresolvedIndex / 4);

    node.x = fallbackCenterX - 180 + column * 120;
    node.y = fallbackCenterY + 60 + row * 90;
    unresolvedIndex += 1;
  }

  // If we have anchor-less tier1 nodes, place them near the vertical spine.
  const unresolvedTier1 = newWorldNodes.filter(
    (node) =>
      isTier1Anchor(node) &&
      (typeof node.x !== "number" || typeof node.y !== "number")
  );

  unresolvedTier1.forEach((node, index) => {
    node.x = 700;
    node.y = 220 + index * 120;
  });

  // Keep a light north-south ordering sanity pass for tier1 anchors.
  tier1.sort((a, b) => (a.y ?? 0) - (b.y ?? 0));
}

function applyNewWorldDownwardShift(nodeMap: NodeMap): void {
  for (const node of nodeMap.values()) {
    if (!isNewWorldNode(node)) continue;
    if (node.feature_type === "sea") continue;
    if (typeof node.x !== "number") continue;
    if (typeof node.y !== "number") continue;

    node.x += NEW_WORLD_HORIZONTAL_SHIFT;
    node.y += NEW_WORLD_DOWNWARD_SHIFT;
  }
}

function applyManualPositionOverrides(nodeMap: NodeMap): void {
  for (const [id, position] of Object.entries(NEW_WORLD_MANUAL_POSITION_OVERRIDES)) {
    setNodePosition(nodeMap, id, position.x, position.y);
  }
}

export function buildRelationalLayout(graphDataset: GraphDataset): GraphDataset {
  const clonedNodes = graphDataset.nodes.map(cloneNode);
  const nodeMap: NodeMap = new Map(clonedNodes.map((node) => [node.id, node]));

  applyTier1Anchors(nodeMap);
  applyRelativeRules(nodeMap);
  applyTierBasedFallbacks(nodeMap);
  applyNewWorldDownwardShift(nodeMap);
  applyManualPositionOverrides(nodeMap);

  return {
    ...graphDataset,
    nodes: clonedNodes
  };
}
