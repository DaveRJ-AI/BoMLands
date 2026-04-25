import type { ChronologyPeriod } from "./toggles";
import type { FeatureType, LocationEvidenceStatus, LocationNodeKind } from "./location";

export type RenderLayer =
  | "background"
  | "sea_underlay"
  | "land_underlay"
  | "terrain_underlay"
  | "city_marker"
  | "route_line"
  | "claim_line"
  | "overlay_path"
  | "label"
  | "interaction";

export type RenderShapeType =
  | "point"
  | "line"
  | "polygon"
  | "underlay_asset"
  | "label_anchor";

export interface RenderStyle {
  visible?: boolean;
  opacity?: number;
  zIndex?: number;
  selectable?: boolean;
  selected?: boolean;
  muted?: boolean;
  dashed?: boolean;
  strokeWidth?: number;
  label?: string;
  className?: string;
}

export interface UnderlayMetadata {
  assetKey?: string;
  assetPath?: string;
  anchorX?: number;
  anchorY?: number;
  width?: number;
  height?: number;
  rotationDegrees?: number;
  preserveAspectRatio?: string;
  hitAreaScale?: number;
  labelOffsetX?: number;
  labelOffsetY?: number;
}

export interface RenderObjectMetadata {
  displayName?: string;
  overlapGroup?: string;
  mergedSourceIds?: string[];
  eventId?: string;
  fromNodeId?: string;
  toNodeId?: string;
  claimType?: string;
  stepType?: string;
  notes?: string;
  layoutKey?: string;
  relationshipLocationId?: string;
  relationshipClaimIds?: string[];

  renderDomain?: string;
  regionScope?: string;
  mapRole?: string;
  visibilityTier?: string;
  certaintyLevel?: string;
  defaultRenderState?: "visible" | "detail_only" | "chronology_only" | "hidden";
  nodeKind?: LocationNodeKind;
  evidenceStatus?: LocationEvidenceStatus;

  labelPriority?: "high" | "medium" | "low" | "hidden";
  labelMode?: "none" | "center" | "above" | "below" | "left" | "right";
  isPrimaryVisual?: boolean;
  firstReference?: string;
  linkedEntities?: string[];
  riverPathMode?: "none" | "solid" | "solid_with_inferred_tail";
  markerVariant?: "circle" | "diamond";
}

export interface RenderableMapObject {
  id: string;
  sourceId: string;
  sourceType: "location" | "claim" | "event_step";
  shapeType: RenderShapeType;
  renderLayer: RenderLayer;
  featureType?: FeatureType | string;
  chronologyPeriods: ChronologyPeriod[];
  primaryPeriod: ChronologyPeriod;
  geometry: {
    x?: number;
    y?: number;
    x2?: number;
    y2?: number;
    points?: Array<{ x: number; y: number }>;
  };
  style: RenderStyle;
  underlay?: UnderlayMetadata;
  metadata?: RenderObjectMetadata;
}

export interface RenderDataset {
  objects: RenderableMapObject[];
}
