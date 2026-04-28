import { useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import type { RenderDataset, RenderableMapObject } from "../../types/render";

type CanvasTierFilters = {
  tier1: boolean;
  tier2: boolean;
  tier3: boolean;
  tier4: boolean;
  tier5: boolean;
};

export interface MapCanvasProps {
  renderDataset?: RenderDataset;
  selectedObjectId?: string | null;
  highlightedObjectIds?: string[];
  onSelectObject?: (objectId: string) => void;
  onClearSelection?: () => void;
  title?: string;
  toolbarContent?: ReactNode;
  tierFilters?: CanvasTierFilters;
  placementAssistEnabled?: boolean;
  onPlacementCoordinateChange?: (coordinate: { x: number; y: number } | null) => void;
}

const DEFAULT_MAP_WIDTH = 1400;
const DEFAULT_MAP_HEIGHT = 1450;
const NEW_WORLD_MAP_WIDTH = 1400;
const NEW_WORLD_MAP_HEIGHT = 2100;
const OLD_WORLD_MAP_WIDTH = 1450;
const OLD_WORLD_MAP_HEIGHT = 1035;
const MIN_ZOOM = 0.7;
const MAX_ZOOM = 4;
const WHEEL_ZOOM_SENSITIVITY = 0.0012;

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function clampPan(
  pan: { x: number; y: number },
  zoom: number,
  canvasWidth: number,
  canvasHeight: number
): { x: number; y: number } {
  if (zoom <= 1) {
    return { x: 0, y: 0 };
  }

  const minPanX = canvasWidth * (1 - zoom);
  const minPanY = canvasHeight * (1 - zoom);

  return {
    x: clamp(pan.x, minPanX, 0),
    y: clamp(pan.y, minPanY, 0)
  };
}

function sortRenderObjects(objects: RenderableMapObject[]): RenderableMapObject[] {
  return [...objects].sort((a, b) => {
    const aZ = a.style.zIndex ?? 0;
    const bZ = b.style.zIndex ?? 0;
    return aZ - bZ;
  });
}

function getDisplayName(object: RenderableMapObject): string {
  return object.metadata?.displayName ?? object.style.label ?? object.id;
}

function getVisibilityTier(object: RenderableMapObject): string {
  return object.metadata?.visibilityTier ?? "tier_2_major";
}

function getMapRole(object: RenderableMapObject): string {
  return object.metadata?.mapRole ?? "";
}

function shouldRenderLabel(
  object: RenderableMapObject,
  zoom: number,
  tierFilters?: CanvasTierFilters
): boolean {
  const priority = object.metadata?.labelPriority ?? "medium";
  const tier = object.metadata?.visibilityTier ?? "tier_2_major";

  if (object.renderLayer === "claim_line" || object.renderLayer === "overlay_path") {
    return false;
  }

  const onlyTier3Selected =
    !!tierFilters &&
    !tierFilters.tier1 &&
    !tierFilters.tier2 &&
    tierFilters.tier3 &&
    !tierFilters.tier4;

  const onlyTier4Selected =
    !!tierFilters &&
    !tierFilters.tier1 &&
    !tierFilters.tier2 &&
    !tierFilters.tier3 &&
    tierFilters.tier4 &&
    !tierFilters.tier5;

  const onlyTier5Selected =
    !!tierFilters &&
    !tierFilters.tier1 &&
    !tierFilters.tier2 &&
    !tierFilters.tier3 &&
    !tierFilters.tier4 &&
    tierFilters.tier5;

  if (tier === "tier_4_detail") {
    return onlyTier4Selected || zoom >= 1.5;
  }

  if (tier === "tier_5_placeholder") {
    return onlyTier5Selected || zoom >= 1.7;
  }

  if (tier === "tier_3_supporting") {
    return onlyTier3Selected || zoom >= 1.25;
  }

  if (priority === "hidden") return false;

  if (priority === "low") {
    return zoom >= 1.1;
  }

  return true;
}

function getTierRadius(object: RenderableMapObject): number {
  switch (getVisibilityTier(object)) {
    case "tier_1_anchor":
      return 8;
    case "tier_2_major":
      return 6;
    case "tier_3_supporting":
      return 4;
    case "tier_4_detail":
      return 2.5;
    case "tier_5_placeholder":
      return 3;
    default:
      return 5;
  }
}

function getTierFontSize(object: RenderableMapObject): number {
  switch (getVisibilityTier(object)) {
    case "tier_1_anchor":
      return 18;
    case "tier_2_major":
      return 14;
    case "tier_3_supporting":
      return 11;
    case "tier_4_detail":
      return 9;
    case "tier_5_placeholder":
      return 9;
    default:
      return 12;
  }
}

function getObjectColors(object: RenderableMapObject): {
  fill: string;
  stroke: string;
  text: string;
} {
  if (object.renderLayer === "overlay_path") {
    return {
      fill: "rgba(13, 148, 136, 0.85)",
      stroke: "rgba(15, 118, 110, 1)",
      text: "#0f766e"
    };
  }

  const mapRole = getMapRole(object);
  const featureType = object.featureType;

  if (mapRole === "water_boundary" || featureType === "sea" || featureType === "river") {
    return {
      fill: "rgba(37, 99, 235, 0.90)",
      stroke: "rgba(30, 64, 175, 1)",
      text: "#1d4ed8"
    };
  }

  if (mapRole === "city_node" || featureType === "city") {
    return {
      fill: "rgba(30, 64, 175, 0.95)",
      stroke: "rgba(15, 23, 42, 1)",
      text: "#1e3a8a"
    };
  }

  if (
    mapRole === "macro_region" ||
    mapRole === "region_underlay" ||
    featureType === "land" ||
    featureType === "region"
  ) {
    return {
      fill: "rgba(146, 64, 14, 0.88)",
      stroke: "rgba(120, 53, 15, 1)",
      text: "#78350f"
    };
  }

  if (mapRole === "gateway") {
    return {
      fill: "rgba(91, 33, 182, 0.88)",
      stroke: "rgba(76, 29, 149, 1)",
      text: "#5b21b6"
    };
  }

  if (mapRole === "landmark_node") {
    return {
      fill: "rgba(82, 82, 91, 0.88)",
      stroke: "rgba(39, 39, 42, 1)",
      text: "#3f3f46"
    };
  }

  return {
    fill: "rgba(100, 116, 139, 0.85)",
    stroke: "rgba(51, 65, 85, 1)",
    text: "#334155"
  };
}

function getObjectAnchor(object: RenderableMapObject): { x: number; y: number } {
  const points = object.geometry.points ?? [];

  if (points.length > 0) {
    const point = points[Math.floor(points.length / 2)] ?? points[0];
    return { x: point.x, y: point.y };
  }

  return {
    x: object.geometry.x ?? 0,
    y: object.geometry.y ?? 0
  };
}

function getPrimaryRenderDomain(objects: RenderableMapObject[]): string {
  for (const object of objects) {
    const domain = object.metadata?.renderDomain;
    if (domain) return domain;
  }

  return "new_world_map";
}

function getCanvasDimensions(renderDomain: string): { width: number; height: number } {
  if (renderDomain === "new_world_map") {
    return {
      width: NEW_WORLD_MAP_WIDTH,
      height: NEW_WORLD_MAP_HEIGHT
    };
  }

  if (renderDomain === "old_world_map") {
    return {
      width: OLD_WORLD_MAP_WIDTH,
      height: OLD_WORLD_MAP_HEIGHT
    };
  }

  return {
    width: DEFAULT_MAP_WIDTH,
    height: DEFAULT_MAP_HEIGHT
  };
}

function renderRiverPath(
  object: RenderableMapObject,
  isSelected: boolean,
  onSelectObject?: (objectId: string) => void
) {
  const points = object.geometry.points ?? [];
  if (points.length < 2) return null;

  const confirmedPoints =
    object.metadata?.riverPathMode === "solid_with_inferred_tail" && points.length >= 4
      ? points.slice(0, points.length - 1)
      : points;

  const inferredTail =
    object.metadata?.riverPathMode === "solid_with_inferred_tail" && points.length >= 4
      ? points.slice(points.length - 2)
      : null;

  const commonProps = object.style.selectable
    ? {
        onClick: () => onSelectObject?.(object.id),
        style: { cursor: "pointer" },
        "data-map-selectable": "true"
      }
    : {
        style: { cursor: "default" }
      };

  return (
    <g key={object.id} {...commonProps}>
      <polyline
        points={confirmedPoints.map((point) => `${point.x},${point.y}`).join(" ")}
        fill="none"
        stroke="#2563eb"
        strokeWidth={isSelected ? 5 : 4}
        opacity={0.9}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {inferredTail ? (
        <polyline
          points={inferredTail.map((point) => `${point.x},${point.y}`).join(" ")}
          fill="none"
          stroke="#2563eb"
          strokeWidth={isSelected ? 5 : 4}
          opacity={0.6}
          strokeDasharray="8 8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ) : null}
    </g>
  );
}

function renderMapShape(
  object: RenderableMapObject,
  isSelected: boolean,
  onSelectObject?: (objectId: string) => void
) {
  if (object.style.visible === false) return null;

  if (object.metadata?.mapRole === "river_path") {
    return renderRiverPath(object, isSelected, onSelectObject);
  }

  const { fill, stroke } = getObjectColors(object);
  const x = object.geometry.x ?? 0;
  const y = object.geometry.y ?? 0;

  const commonProps = object.style.selectable
    ? {
        onClick: () => onSelectObject?.(object.id),
        style: { cursor: "pointer" },
        "data-map-selectable": "true"
      }
    : {
        style: { cursor: "default" }
      };

  const selectedStroke = isSelected ? "#0f172a" : stroke;
  const selectedStrokeWidth = isSelected ? 3 : 1.5;
  const opacity = object.style.opacity ?? 1;

  if (object.shapeType === "underlay_asset") {
    const width = object.underlay?.width ?? 180;
    const height = object.underlay?.height ?? 100;
    const assetPath = object.underlay?.assetPath;
    const rotationDegrees = object.underlay?.rotationDegrees ?? 0;
    const preserveAspectRatio =
      object.underlay?.preserveAspectRatio ?? "xMidYMid meet";

    if (!assetPath) return null;

    return (
      <g key={object.id} {...commonProps}>
        <image
          href={assetPath}
          x={x - width / 2}
          y={y - height / 2}
          width={width}
          height={height}
          opacity={opacity}
          preserveAspectRatio={preserveAspectRatio}
          transform={
            rotationDegrees !== 0 ? `rotate(${rotationDegrees} ${x} ${y})` : undefined
          }
        />
      </g>
    );
  }

  if (object.shapeType === "line") {
    return (
      <g key={object.id} {...commonProps}>
        <polyline
          points={
            object.geometry.points?.map((point) => `${point.x},${point.y}`).join(" ") ??
            `${x},${y} ${(object.geometry.x2 ?? x + 80)},${object.geometry.y2 ?? y + 40}`
          }
          fill="none"
          stroke={selectedStroke}
          strokeWidth={selectedStrokeWidth}
          strokeDasharray={object.style.dashed ? "8 6" : undefined}
          opacity={opacity}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
    );
  }

  const radius = isSelected ? getTierRadius(object) + 2 : getTierRadius(object);
  const markerVariant = object.metadata?.markerVariant ?? "circle";
  const diamondPoints = `${x},${y - radius} ${x + radius},${y} ${x},${y + radius} ${x - radius},${y}`;
  const selectedDiamondOuter = `${x},${y - (radius + 9)} ${x + radius + 9},${y} ${x},${y + radius + 9} ${x - radius - 9},${y}`;
  const selectedDiamondInner = `${x},${y - (radius + 5)} ${x + radius + 5},${y} ${x},${y + radius + 5} ${x - radius - 5},${y}`;

  return (
    <g key={object.id} {...commonProps}>
      {isSelected ? (
        <>
          {markerVariant === "diamond" ? (
            <>
              <polygon
                points={selectedDiamondOuter}
                fill="rgba(250, 204, 21, 0.22)"
                stroke="rgba(234, 179, 8, 0.95)"
                strokeWidth={2.5}
              />
              <polygon
                points={selectedDiamondInner}
                fill="none"
                stroke="rgba(15, 23, 42, 0.9)"
                strokeWidth={2}
              />
            </>
          ) : (
            <>
              <circle
                cx={x}
                cy={y}
                r={radius + 9}
                fill="rgba(250, 204, 21, 0.22)"
                stroke="rgba(234, 179, 8, 0.95)"
                strokeWidth={2.5}
              />
              <circle
                cx={x}
                cy={y}
                r={radius + 5}
                fill="none"
                stroke="rgba(15, 23, 42, 0.9)"
                strokeWidth={2}
              />
            </>
          )}
        </>
      ) : null}
      {markerVariant === "diamond" ? (
        <polygon
          points={diamondPoints}
          fill={fill}
          stroke={selectedStroke}
          strokeWidth={selectedStrokeWidth}
          opacity={opacity}
        />
      ) : (
        <circle
          cx={x}
          cy={y}
          r={radius}
          fill={fill}
          stroke={selectedStroke}
          strokeWidth={selectedStrokeWidth}
          opacity={opacity}
        />
      )}
    </g>
  );
}

function renderObjectLabel(
  object: RenderableMapObject,
  isSelected: boolean,
  zoom: number,
  tierFilters?: CanvasTierFilters
) {
  if (!shouldRenderLabel(object, zoom, tierFilters)) return null;

  const { text } = getObjectColors(object);
  const label = getDisplayName(object);

  if (!label) return null;

  const baseX = object.geometry.x ?? 0;
  const baseY = object.geometry.y ?? 0;
  const labelMode = object.metadata?.labelMode ?? "above";
  const radius = getTierRadius(object);

  let x = baseX;
  let y = baseY;

  switch (labelMode) {
    case "above":
      y -= radius + 5;
      break;
    case "below":
      y += radius + 10;
      break;
    case "right":
      x += radius + 5;
      break;
    case "left":
      x -= radius + 5;
      break;
    case "center":
      break;
    case "none":
      return null;
    default:
      y -= radius + 5;
      break;
  }

  const isCentered = labelMode === "center";
  const textAnchor =
    labelMode === "right" ? "start" : labelMode === "left" ? "end" : "middle";

  return (
    <text
      key={`${object.id}-label`}
      x={x}
      y={y}
      textAnchor={textAnchor}
      dominantBaseline={isCentered ? "middle" : "auto"}
      fontSize={isSelected ? getTierFontSize(object) + 2 : getTierFontSize(object)}
      fontWeight={isSelected ? 800 : getVisibilityTier(object) === "tier_1_anchor" ? 700 : 600}
      fill={isSelected ? "#0f172a" : text}
      stroke={isSelected ? "rgba(255,255,255,0.92)" : "none"}
      strokeWidth={isSelected ? 4 : 0}
      paintOrder="stroke"
      style={{ pointerEvents: "none", userSelect: "none" }}
    >
      {label}
    </text>
  );
}

function LegendSwatch({
  fill,
  stroke,
  variant = "circle"
}: {
  fill: string;
  stroke: string;
  variant?: "circle" | "diamond";
}) {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true" className="shrink-0">
      {variant === "diamond" ? (
        <polygon points="9,2 16,9 9,16 2,9" fill={fill} stroke={stroke} strokeWidth="1.5" />
      ) : (
        <circle cx="9" cy="9" r="5.5" fill={fill} stroke={stroke} strokeWidth="1.5" />
      )}
    </svg>
  );
}

function LegendItem({
  label,
  fill,
  stroke,
  variant = "circle"
}: {
  label: string;
  fill: string;
  stroke: string;
  variant?: "circle" | "diamond";
}) {
  return (
    <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white/70 px-3 py-1.5 text-xs font-medium text-slate-700">
      <LegendSwatch fill={fill} stroke={stroke} variant={variant} />
      <span>{label}</span>
    </div>
  );
}

export default function MapCanvas({
  renderDataset,
  selectedObjectId = null,
  highlightedObjectIds = [],
  onSelectObject,
  onClearSelection,
  title = "Map Canvas",
  toolbarContent,
  tierFilters,
  placementAssistEnabled = false,
  onPlacementCoordinateChange
}: MapCanvasProps) {
  const safeObjects = Array.isArray(renderDataset?.objects) ? renderDataset.objects : [];
  const objects = useMemo(() => sortRenderObjects(safeObjects), [safeObjects]);
  const primaryRenderDomain = useMemo(() => getPrimaryRenderDomain(objects), [objects]);
  const canvasDimensions = useMemo(
    () => getCanvasDimensions(primaryRenderDomain),
    [primaryRenderDomain]
  );
  const canvasWidth = canvasDimensions.width;
  const canvasHeight = canvasDimensions.height;

  const objectById = useMemo(() => {
    const map = new Map<string, RenderableMapObject>();
    for (const object of objects) {
      map.set(object.id, object);
    }
    return map;
  }, [objects]);
  const highlightedObjectIdSet = useMemo(
    () => new Set(highlightedObjectIds),
    [highlightedObjectIds]
  );

  const [zoom, setZoom] = useState<number>(1);
  const [zoomInput, setZoomInput] = useState<string>("100");
  const [panX, setPanX] = useState<number>(0);
  const [panY, setPanY] = useState<number>(0);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  const svgRef = useRef<SVGSVGElement | null>(null);
  const dragStartRef = useRef<{ x: number; y: number; panX: number; panY: number } | null>(
    null
  );
  const didDragRef = useRef<boolean>(false);
  const lastAutoFocusedSelectionRef = useRef<string | null>(null);

  function setZoomLevel(nextZoom: number) {
    const clamped = clamp(Number(nextZoom.toFixed(2)), MIN_ZOOM, MAX_ZOOM);
    setZoom(clamped);
    setZoomInput(String(Math.round(clamped * 100)));
  }

  function zoomBy(delta: number) {
    setZoomLevel(zoom + delta);
  }

  function resetView() {
    setZoomLevel(1);
    setPanX(0);
    setPanY(0);
  }

  function handlePointerDown(event: React.PointerEvent<SVGSVGElement>) {
    setIsDragging(true);
    didDragRef.current = false;
    dragStartRef.current = {
      x: event.clientX,
      y: event.clientY,
      panX,
      panY
    };
  }

  function handlePointerMove(event: React.PointerEvent<SVGSVGElement>) {
    if (placementAssistEnabled && svgRef.current) {
      const rect = svgRef.current.getBoundingClientRect();
      const pointerX = event.clientX - rect.left;
      const pointerY = event.clientY - rect.top;
      const svgX = (pointerX / rect.width) * canvasWidth;
      const svgY = (pointerY / rect.height) * canvasHeight;

      const mapX = (svgX - panX) / zoom;
      const mapY = (svgY - panY) / zoom;

      onPlacementCoordinateChange?.({
        x: Number(mapX.toFixed(1)),
        y: Number(mapY.toFixed(1))
      });
    }

    if (!isDragging || !dragStartRef.current) return;

    const dx = event.clientX - dragStartRef.current.x;
    const dy = event.clientY - dragStartRef.current.y;

    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
      didDragRef.current = true;
    }

    const nextPan = clampPan(
      {
        x: dragStartRef.current.panX + dx,
        y: dragStartRef.current.panY + dy
      },
      zoom,
      canvasWidth,
      canvasHeight
    );

    setPanX(nextPan.x);
    setPanY(nextPan.y);
  }

  function handlePointerUp() {
    setIsDragging(false);
    dragStartRef.current = null;
  }

  function handlePointerLeave() {
    handlePointerUp();
    didDragRef.current = false;
    onPlacementCoordinateChange?.(null);
  }

  function handleBlankMapClick() {
    if (didDragRef.current) {
      didDragRef.current = false;
      return;
    }

    onClearSelection?.();
  }

  function handleSvgClick(event: React.MouseEvent<SVGSVGElement>) {
    if (didDragRef.current) {
      didDragRef.current = false;
      return;
    }

    const target = event.target as Element | null;
    const clickedSelectable = target?.closest?.("[data-map-selectable='true']");

    if (clickedSelectable) {
      return;
    }

    handleBlankMapClick();
  }

  function handleWheel(event: React.WheelEvent<HTMLElement>) {
    event.preventDefault();

    if (!svgRef.current) return;

    const rect = svgRef.current.getBoundingClientRect();
    const pointerX = event.clientX - rect.left;
    const pointerY = event.clientY - rect.top;
    const svgX = (pointerX / rect.width) * canvasWidth;
    const svgY = (pointerY / rect.height) * canvasHeight;

    const rawIntensity = Math.min(Math.abs(event.deltaY), 120);
    const zoomDelta = rawIntensity * WHEEL_ZOOM_SENSITIVITY;
    const zoomFactor = event.deltaY < 0 ? 1 + zoomDelta : 1 / (1 + zoomDelta);
    const nextZoom = clamp(Number((zoom * zoomFactor).toFixed(3)), MIN_ZOOM, MAX_ZOOM);

    if (nextZoom === zoom) return;

    const mapXBefore = (svgX - panX) / zoom;
    const mapYBefore = (svgY - panY) / zoom;

    const nextPan = clampPan(
      {
        x: svgX - mapXBefore * nextZoom,
        y: svgY - mapYBefore * nextZoom
      },
      nextZoom,
      canvasWidth,
      canvasHeight
    );

    setZoom(nextZoom);
    setZoomInput(String(Math.round(nextZoom * 100)));
    setPanX(nextPan.x);
    setPanY(nextPan.y);
  }

  function applyZoomInput() {
    const parsed = Number(zoomInput);
    if (!Number.isFinite(parsed)) {
      setZoomInput(String(Math.round(zoom * 100)));
      return;
    }

    setZoomLevel(parsed / 100);
  }

  function handleZoomInputKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      applyZoomInput();
    }
  }

  useEffect(() => {
    if (!selectedObjectId) return;
    if (lastAutoFocusedSelectionRef.current === selectedObjectId) return;

    const selectedObject = objectById.get(selectedObjectId);
    if (!selectedObject) return;

    const { x, y } = getObjectAnchor(selectedObject);

    const targetZoom =
      getVisibilityTier(selectedObject) === "tier_4_detail"
        ? 1.75
        : getVisibilityTier(selectedObject) === "tier_3_supporting"
          ? 1.45
          : 1.2;

    const visibleBounds = {
      left: -panX / zoom,
      right: (canvasWidth - panX) / zoom,
      top: -panY / zoom,
      bottom: (canvasHeight - panY) / zoom
    };

    const insetX = canvasWidth * 0.12 / zoom;
    const insetY = canvasHeight * 0.12 / zoom;
    const isComfortablyVisible =
      x >= visibleBounds.left + insetX &&
      x <= visibleBounds.right - insetX &&
      y >= visibleBounds.top + insetY &&
      y <= visibleBounds.bottom - insetY;

    if (isComfortablyVisible) {
      return;
    }

    const targetFocusX = canvasWidth / 2;
    const targetFocusY =
      canvasHeight > canvasWidth ? canvasHeight * 0.35 : canvasHeight / 2;

    const nextPan = clampPan(
      {
        x: targetFocusX - x * targetZoom,
        y: targetFocusY - y * targetZoom
      },
      targetZoom,
      canvasWidth,
      canvasHeight
    );

    setZoom(targetZoom);
    setZoomInput(String(Math.round(targetZoom * 100)));
    setPanX(nextPan.x);
    setPanY(nextPan.y);
    lastAutoFocusedSelectionRef.current = selectedObjectId;
  }, [selectedObjectId, objectById, canvasWidth, canvasHeight]);

  useEffect(() => {
    if (!selectedObjectId) {
      lastAutoFocusedSelectionRef.current = null;
    }
  }, [selectedObjectId]);

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
          <p className="mt-1 text-sm text-slate-500">
            Relational map with related verse level text for each location and relavent connections.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => zoomBy(0.2)}
            className="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            aria-label="Zoom in"
          >
            +
          </button>
          <button
            type="button"
            onClick={() => zoomBy(-0.2)}
            className="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            aria-label="Zoom out"
          >
            −
          </button>
          <button
            type="button"
            onClick={resetView}
            className="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium uppercase tracking-wide text-slate-700 hover:bg-slate-50"
          >
            Reset
          </button>
          <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-[11px] text-slate-500">
            <span>Zoom</span>
            <input
              type="text"
              value={zoomInput}
              onChange={(event) => setZoomInput(event.target.value.replace(/[^\d]/g, ""))}
              onBlur={applyZoomInput}
              onKeyDown={handleZoomInputKeyDown}
              className="w-12 rounded-md border border-slate-300 bg-white px-2 py-1 text-right text-xs text-slate-700 outline-none"
            />
            <span>%</span>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
            {objects.length} object{objects.length === 1 ? "" : "s"}
          </div>
        </div>
      </div>

      {toolbarContent ? <div className="mb-4">{toolbarContent}</div> : null}

      <div className="rounded-3xl border border-slate-300 bg-[#f4ead7] p-4">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <div className="mr-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Legend
          </div>
          <LegendItem
            label="Land / Region"
            fill="rgba(146, 64, 14, 0.88)"
            stroke="rgba(120, 53, 15, 1)"
          />
          <LegendItem
            label="City"
            fill="rgba(30, 64, 175, 0.95)"
            stroke="rgba(15, 23, 42, 1)"
          />
          <LegendItem
            label="Water"
            fill="rgba(37, 99, 235, 0.90)"
            stroke="rgba(30, 64, 175, 1)"
          />
          <LegendItem
            label="Landmark"
            fill="rgba(82, 82, 91, 0.88)"
            stroke="rgba(39, 39, 42, 1)"
          />
          <LegendItem
            label="Placeholder"
            fill="rgba(100, 116, 139, 0.85)"
            stroke="rgba(51, 65, 85, 1)"
            variant="diamond"
          />
        </div>

        <div
          className="overflow-hidden overscroll-none rounded-2xl border border-amber-200 bg-[#efe4c8] shadow-inner"
          onWheel={handleWheel}
        >
          <svg
            ref={svgRef}
            viewBox={`0 0 ${canvasWidth} ${canvasHeight}`}
            className="block min-w-[1000px] touch-none"
            role="img"
            aria-label="Book of Mormon relational geography map preview"
            onClick={handleSvgClick}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerLeave}
            style={{ cursor: isDragging ? "grabbing" : "grab" }}
          >
            <rect x="0" y="0" width={canvasWidth} height={canvasHeight} fill="#efe4c8" />

            <g transform={`translate(${panX}, ${panY}) scale(${zoom})`}>
              {objects.map((object) =>
                renderMapShape(
                  object,
                  selectedObjectId === object.id || highlightedObjectIdSet.has(object.id),
                  onSelectObject
                )
              )}

              {objects
                .filter(
                  (object) =>
                    object.renderLayer !== "claim_line" &&
                    object.renderLayer !== "route_line" &&
                    object.renderLayer !== "overlay_path"
                )
                .map((object) =>
                  renderObjectLabel(
                    object,
                    selectedObjectId === object.id || highlightedObjectIdSet.has(object.id),
                    zoom,
                    tierFilters
                  )
                )}
            </g>
          </svg>
        </div>

        <div className="mt-3 text-xs leading-5 text-slate-500">
          Zoom and pan the map, then click a point or use search to inspect its details on the
          right.
        </div>
      </div>
    </section>
  );
}
