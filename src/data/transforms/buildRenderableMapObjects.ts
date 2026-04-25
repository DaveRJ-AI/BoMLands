import type {
  GraphDataset,
  GraphEdge,
  GraphNode,
  OverlayPath
} from "../../types/graph";
import type {
  RenderDataset,
  RenderLayer,
  RenderableMapObject
} from "../../types/render";

type StaticUnderlayDefinition = {
  id: string;
  displayName: string;
  renderLayer: RenderLayer;
  featureType: GraphNode["feature_type"];
  renderDomain: string;
  chronologyPeriods: GraphNode["chronology_periods"];
  primaryPeriod: GraphNode["primary_period"];
  x: number;
  y: number;
  width: number;
  height: number;
  rotationDegrees?: number;
  assetPath: string;
  opacity: number;
  zIndex: number;
};

const OLD_WORLD_UNDERLAYS: StaticUnderlayDefinition[] = [
  {
    id: "new_world_underlay_background",
    displayName: "New World Background Underlay",
    renderLayer: "background",
    featureType: "unknown_geographic",
    renderDomain: "new_world_map",
    chronologyPeriods: ["pre_christ"],
    primaryPeriod: "pre_christ",
    x: 700,
    y: 1050,
    width: 1400,
    height: 2100,
    assetPath: "/assets/map-underlays/new_world_underlay.png",
    opacity: 0.75,
    zIndex: 0
  },
  {
    id: "old_world_underlay_background",
    displayName: "Old World Background Underlay",
    renderLayer: "background",
    featureType: "unknown_geographic",
    renderDomain: "old_world_map",
    chronologyPeriods: ["pre_christ"],
    primaryPeriod: "pre_christ",
    x: 725,
    y: 517.5,
    width: 1450,
    height: 1035,
    assetPath: "/assets/map-underlays/background_old_world.png",
    opacity: 0.3,
    zIndex: 0
  },
  {
    id: "old_world_underlay_jerusalem",
    displayName: "Jerusalem Underlay",
    renderLayer: "land_underlay",
    featureType: "region",
    renderDomain: "old_world_map",
    chronologyPeriods: ["pre_christ"],
    primaryPeriod: "pre_christ",
    x: 375,
    y: 237,
    width: 310,
    height: 206,
    assetPath: "/assets/map-underlays/Jerusalem.png",
    opacity: 0.3,
    zIndex: 2
  },
  {
    id: "old_world_underlay_red_sea",
    displayName: "Red Sea Corridor Underlay",
    renderLayer: "sea_underlay",
    featureType: "sea",
    renderDomain: "old_world_map",
    chronologyPeriods: ["pre_christ"],
    primaryPeriod: "pre_christ",
    x: 506,
    y: 650,
    width: 390,
    height: 610,
    rotationDegrees: 0,
    assetPath: "/assets/map-underlays/red_sea.png",
    opacity: 0,
    zIndex: 1
  },
  {
    id: "old_world_underlay_nahom",
    displayName: "Nahom Underlay",
    renderLayer: "terrain_underlay",
    featureType: "region",
    renderDomain: "old_world_map",
    chronologyPeriods: ["pre_christ"],
    primaryPeriod: "pre_christ",
    x: 854,
    y: 716,
    width: 468,
    height: 312,
    assetPath: "/assets/map-underlays/Nahom.png",
    opacity: 0.45,
    zIndex: 2
  },
  {
    id: "old_world_underlay_bountiful",
    displayName: "Bountiful Underlay",
    renderLayer: "terrain_underlay",
    featureType: "region",
    renderDomain: "old_world_map",
    chronologyPeriods: ["pre_christ"],
    primaryPeriod: "pre_christ",
    x: 1322,
    y: 693,
    width: 220,
    height: 327,
    assetPath: "/assets/map-underlays/bountiful_old_world.png",
    opacity: 0.45,
    zIndex: 2
  }
];

function getDefaultLayerForNode(node: GraphNode): RenderLayer {
  const mapRole = node.metadata?.map_role;
  const featureType = node.feature_type;

  if (mapRole === "water_boundary" || featureType === "sea" || featureType === "river") {
    return "sea_underlay";
  }

  if (
    mapRole === "city_node" ||
    featureType === "city" ||
    featureType === "structure_landmark"
  ) {
    return "city_marker";
  }

  if (
    mapRole === "macro_region" ||
    mapRole === "region_underlay" ||
    featureType === "land" ||
    featureType === "region" ||
    featureType === "border_region"
  ) {
    return "land_underlay";
  }

  return "terrain_underlay";
}

function getDefaultLayerForEdge(): RenderLayer {
  return "claim_line";
}

function getDefaultLayerForOverlay(): RenderLayer {
  return "overlay_path";
}

function getDefaultNodeStyle(node: GraphNode): RenderableMapObject["style"] {
  const common = {
    visible: true,
    opacity: 1,
    selectable: true,
    selected: false,
    muted: false
  };

  const mapRole = node.metadata?.map_role;
  const featureType = node.feature_type;

  if (mapRole === "water_boundary" || featureType === "sea" || featureType === "river") {
    return {
      ...common,
      zIndex: 12
    };
  }

  if (
    mapRole === "city_node" ||
    featureType === "city" ||
    featureType === "structure_landmark"
  ) {
    return {
      ...common,
      zIndex: 40
    };
  }

  if (mapRole === "macro_region" || mapRole === "region_underlay") {
    return {
      ...common,
      zIndex: 18
    };
  }

  return {
    ...common,
    zIndex: 24
  };
}

function getDefaultEdgeStyle(): RenderableMapObject["style"] {
  return {
    visible: false,
    opacity: 0,
    selectable: false,
    selected: false,
    muted: true,
    dashed: false,
    strokeWidth: 2,
    zIndex: 30
  };
}

function getDefaultOverlayStyle(): RenderableMapObject["style"] {
  return {
    visible: false,
    opacity: 0,
    selectable: false,
    selected: false,
    muted: true,
    dashed: false,
    strokeWidth: 3,
    zIndex: 50
  };
}

function getLabelPriorityForNode(
  node: GraphNode
): "high" | "medium" | "low" | "hidden" {
  const visibilityTier = getRenderableVisibilityTier(node);

  switch (visibilityTier) {
    case "tier_1_anchor":
      return "high";
    case "tier_2_major":
      return "medium";
    case "tier_3_supporting":
      return "low";
    case "tier_4_detail":
      return "hidden";
    default:
      return "medium";
  }
}

function isPlaceholderNode(node: GraphNode): boolean {
  const notes = node.metadata?.notes ?? "";
  return notes.startsWith("Backfilled from PDF cross-check audit");
}

function getRenderableVisibilityTier(node: GraphNode): string {
  if (isPlaceholderNode(node)) {
    return "tier_5_placeholder";
  }

  return node.metadata?.visibility_tier ?? "tier_2_major";
}

function getLabelModeForNode(
  node: GraphNode
): "none" | "center" | "above" | "below" | "left" | "right" {
  const mapRole = node.metadata?.map_role;
  const featureType = node.feature_type;

  if (mapRole === "water_boundary" || featureType === "sea") {
    return "above";
  }

  if (mapRole === "macro_region") {
    return "above";
  }

  if (mapRole === "region_underlay" || featureType === "land" || featureType === "region") {
    return "above";
  }

  if (mapRole === "city_node" || featureType === "city") {
    return "above";
  }

  if (mapRole === "gateway") {
    return "above";
  }

  if (mapRole === "landmark_node") {
    return "right";
  }

  return "right";
}

export function buildRenderableNodeObjects(
  nodes: GraphNode[]
): RenderableMapObject[] {
  const objects: RenderableMapObject[] = [];

  for (const node of nodes) {
    const renderableVisibilityTier = getRenderableVisibilityTier(node);
    const geometry: RenderableMapObject["geometry"] = {};

    if (typeof node.x === "number") {
      geometry.x = node.x;
    }

    if (typeof node.y === "number") {
      geometry.y = node.y;
    }

    objects.push({
      id: `render_node_${node.id}`,
      sourceId: node.id,
      sourceType: "location",
      shapeType: "point",
      renderLayer: getDefaultLayerForNode(node),
      featureType: node.feature_type,
      chronologyPeriods: node.chronology_periods,
      primaryPeriod: node.primary_period,
      geometry,
      style: {
        ...getDefaultNodeStyle(node),
        label: node.label
      },
      metadata: {
        displayName: node.label,
        overlapGroup: node.overlap_group,
        notes: node.metadata?.notes,
        renderDomain: node.metadata?.render_domain,
        regionScope: node.metadata?.region_scope,
        mapRole: node.metadata?.map_role,
        visibilityTier: renderableVisibilityTier,
        certaintyLevel: node.metadata?.certainty_level,
        defaultRenderState: node.metadata?.default_render_state,
        nodeKind: node.metadata?.node_kind,
        evidenceStatus: node.metadata?.evidence_status,
        labelPriority: getLabelPriorityForNode(node),
        labelMode: getLabelModeForNode(node),
        firstReference: node.metadata?.first_reference,
        linkedEntities: node.metadata?.linked_entities,
        markerVariant: isPlaceholderNode(node) ? "diamond" : "circle"
      }
    });
  }

  return objects;
}

function getRenderStateRank(
  renderState?: "visible" | "detail_only" | "chronology_only" | "hidden"
): number {
  switch (renderState) {
    case "visible":
      return 0;
    case "detail_only":
      return 1;
    case "chronology_only":
      return 2;
    case "hidden":
      return 3;
    default:
      return 1;
  }
}

function mergeChronologySplitNodeObjects(
  objects: RenderableMapObject[]
): RenderableMapObject[] {
  const grouped = new Map<string, RenderableMapObject[]>();

  for (const object of objects) {
    if (
      object.sourceType !== "location" ||
      object.shapeType !== "point" ||
      !object.metadata?.overlapGroup ||
      !object.metadata?.displayName
    ) {
      const soloKey = `solo:${object.id}`;
      grouped.set(soloKey, [object]);
      continue;
    }

    const key = [
      object.metadata.renderDomain ?? "new_world_map",
      object.metadata.overlapGroup,
      object.featureType ?? "unknown",
      object.metadata.displayName
    ].join("::");

    const existing = grouped.get(key) ?? [];
    existing.push(object);
    grouped.set(key, existing);
  }

  const merged: RenderableMapObject[] = [];

  for (const group of grouped.values()) {
    if (group.length === 1) {
      merged.push(group[0]);
      continue;
    }

    const uniqueSourceIds = Array.from(new Set(group.map((entry) => entry.sourceId)));
    if (uniqueSourceIds.length <= 1) {
      merged.push(group[0]);
      continue;
    }

    const isContinuityMerge =
      uniqueSourceIds.some((sourceId) => sourceId.endsWith("_post")) &&
      group.every(
        (entry) =>
          entry.sourceType === "location" &&
          entry.shapeType === "point" &&
          entry.featureType === group[0].featureType &&
          entry.metadata?.displayName === group[0].metadata?.displayName
      );

    if (!isContinuityMerge) {
      merged.push(...group);
      continue;
    }

    const primary = [...group].sort((a, b) => {
      const stateDelta =
        getRenderStateRank(a.metadata?.defaultRenderState) -
        getRenderStateRank(b.metadata?.defaultRenderState);
      if (stateDelta !== 0) return stateDelta;

      const labelDelta = (b.style.label?.length ?? 0) - (a.style.label?.length ?? 0);
      if (labelDelta !== 0) return labelDelta;

      return a.sourceId.localeCompare(b.sourceId);
    })[0];

    const chronologyPeriods = Array.from(
      new Set(group.flatMap((entry) => entry.chronologyPeriods))
    );

    const linkedEntities = Array.from(
      new Set(
        group.flatMap((entry) => entry.metadata?.linkedEntities ?? [])
      )
    );

    merged.push({
      ...primary,
      chronologyPeriods,
      metadata: {
        ...primary.metadata,
        mergedSourceIds: uniqueSourceIds,
        linkedEntities
      }
    });
  }

  return merged;
}

function buildStaticUnderlayObjects(): RenderableMapObject[] {
  return OLD_WORLD_UNDERLAYS.map((underlay) => ({
    id: underlay.id,
    sourceId: underlay.id,
    sourceType: "location",
    shapeType: "underlay_asset",
    renderLayer: underlay.renderLayer,
    featureType: underlay.featureType,
    chronologyPeriods: underlay.chronologyPeriods,
    primaryPeriod: underlay.primaryPeriod,
    geometry: {
      x: underlay.x,
      y: underlay.y
    },
    style: {
      visible: true,
      opacity: underlay.opacity,
      selectable: false,
      selected: false,
      muted: false,
      zIndex: underlay.zIndex
    },
    underlay: {
      assetPath: underlay.assetPath,
      anchorX: underlay.x,
      anchorY: underlay.y,
      width: underlay.width,
      height: underlay.height,
      rotationDegrees: underlay.rotationDegrees,
      preserveAspectRatio:
        underlay.renderLayer === "background" ? "xMidYMid slice" : "xMidYMid meet"
    },
    metadata: {
      displayName: underlay.displayName,
      renderDomain: underlay.renderDomain,
      mapRole: "region_underlay",
      visibilityTier: "tier_1_anchor",
      certaintyLevel: "inference_supported",
      defaultRenderState: "visible",
      nodeKind: "derived_overlay",
      evidenceStatus: "inference_supported",
      isPrimaryVisual: false,
      labelPriority: "hidden",
      labelMode: "none"
    }
  }));
}

export function buildRenderableEdgeObjects(
  edges: GraphEdge[]
): RenderableMapObject[] {
  return edges.map((edge) => ({
    id: `render_edge_${edge.id}`,
    sourceId: edge.id,
    sourceType: "claim",
    shapeType: "line",
    renderLayer: getDefaultLayerForEdge(),
    chronologyPeriods: edge.chronology_periods,
    primaryPeriod: edge.primary_period,
    geometry: {},
    style: {
      ...getDefaultEdgeStyle(),
      dashed: edge.metadata?.claim_basis === "tentative_inference",
      label: edge.claim_type
    },
    metadata: {
      claimType: edge.claim_type,
      notes: edge.metadata?.notes,
      defaultRenderState: "hidden"
    }
  }));
}

export function buildRenderableOverlayObjects(
  overlays: OverlayPath[] = [],
  nodes: GraphNode[] = []
): RenderableMapObject[] {
  const objects: RenderableMapObject[] = [];
  const nodeMap = new Map(nodes.map((node) => [node.id, node]));

  for (const overlay of overlays) {
    for (const step of overlay.steps) {
      const fromNode = nodeMap.get(step.from_node_id);
      const toNode = nodeMap.get(step.to_node_id);
      const renderDomain =
        fromNode?.metadata?.render_domain &&
        fromNode.metadata.render_domain === toNode?.metadata?.render_domain
          ? fromNode.metadata.render_domain
          : undefined;

      objects.push({
        id: `render_overlay_${step.event_step_id}`,
        sourceId: step.event_step_id,
        sourceType: "event_step",
        shapeType: "line",
        renderLayer: getDefaultLayerForOverlay(),
        chronologyPeriods: step.chronology_periods,
        primaryPeriod: step.primary_period,
        geometry: {},
        style: {
          ...getDefaultOverlayStyle(),
          visible: true,
          opacity: 0.8,
          muted: false,
          label: overlay.event_name
        },
        metadata: {
          eventId: overlay.event_id,
          fromNodeId: step.from_node_id,
          toNodeId: step.to_node_id,
          stepType: step.step_type,
          notes: step.notes,
          renderDomain,
          defaultRenderState: "visible"
        }
      });
    }
  }

  return objects;
}

export function buildRenderableMapObjects(
  graphDataset: GraphDataset
): RenderDataset {
  const nodeObjects = mergeChronologySplitNodeObjects(
    buildRenderableNodeObjects(graphDataset.nodes)
  );
  const underlayObjects = buildStaticUnderlayObjects();
  const edgeObjects = buildRenderableEdgeObjects(graphDataset.edges);
  const overlayObjects = buildRenderableOverlayObjects(
    graphDataset.overlays,
    graphDataset.nodes
  );

  return {
    objects: [...underlayObjects, ...nodeObjects, ...edgeObjects, ...overlayObjects]
  };
}
