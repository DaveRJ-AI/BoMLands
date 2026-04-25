import type { RenderableMapObject } from "../../types/render";

export interface OrganicShapeStyle {
  fill: string;
  stroke: string;
  text: string;
}

function getStableSeed(input: string): number {
  let hash = 0;

  for (let i = 0; i < input.length; i += 1) {
    hash = (hash * 31 + input.charCodeAt(i)) >>> 0;
  }

  return hash;
}

function seededOffset(seed: number, index: number, range: number): number {
  const value = Math.sin(seed * 0.001 + index * 1.61803398875) * 0.5 + 0.5;
  return (value * 2 - 1) * range;
}

/**
 * Primary visuals are the map features we want to read first.
 * Secondary visuals still matter, but should feel quieter and lighter.
 */
export function isSecondaryVisual(object: RenderableMapObject): boolean {
  return object.metadata?.isPrimaryVisual === false;
}

export function getObjectColors(object: RenderableMapObject): OrganicShapeStyle {
  const secondary = isSecondaryVisual(object);

  switch (object.renderLayer) {
    case "sea_underlay":
      return {
        fill: secondary ? "rgba(147, 197, 253, 0.14)" : "rgba(147, 197, 253, 0.24)",
        stroke: secondary ? "rgba(37, 99, 235, 0.24)" : "rgba(37, 99, 235, 0.42)",
        text: "#1e3a8a"
      };

    case "land_underlay":
      return {
        fill: secondary ? "rgba(217, 185, 129, 0.12)" : "rgba(217, 185, 129, 0.22)",
        stroke: secondary ? "rgba(146, 64, 14, 0.22)" : "rgba(146, 64, 14, 0.45)",
        text: "#3f2a18"
      };

    case "terrain_underlay":
      return {
        fill: secondary ? "rgba(161, 161, 170, 0.08)" : "rgba(161, 161, 170, 0.14)",
        stroke: secondary ? "rgba(82, 82, 91, 0.18)" : "rgba(82, 82, 91, 0.35)",
        text: "#27272a"
      };

    case "claim_line":
      return {
        fill: "transparent",
        stroke: "rgba(147, 51, 234, 0.42)",
        text: "#581c87"
      };

    case "route_line":
      return {
        fill: "transparent",
        stroke: "rgba(5, 150, 105, 0.52)",
        text: "#065f46"
      };

    case "city_marker":
      return {
        fill: "rgba(30, 41, 59, 0.92)",
        stroke: "rgba(15, 23, 42, 1)",
        text: "#0f172a"
      };

    default:
      return {
        fill: secondary ? "rgba(226, 232, 240, 0.18)" : "rgba(226, 232, 240, 0.40)",
        stroke: secondary ? "rgba(100, 116, 139, 0.22)" : "rgba(100, 116, 139, 0.45)",
        text: "#334155"
      };
  }
}

/**
 * Secondary shapes should consume less space so primary geography can read first.
 */
function getAdjustedDimensions(object: RenderableMapObject): { width: number; height: number } {
  const width = object.underlay?.width ?? 180;
  const height = object.underlay?.height ?? 100;

  if (!isSecondaryVisual(object)) {
    return { width, height };
  }

  return {
    width: Math.round(width * 0.78),
    height: Math.round(height * 0.74)
  };
}

function buildBlobPath(
  cx: number,
  cy: number,
  width: number,
  height: number,
  seedKey: string,
  roughness: number
): string {
  const seed = getStableSeed(seedKey);

  const left = cx - width / 2;
  const right = cx + width / 2;
  const top = cy - height / 2;
  const bottom = cy + height / 2;

  const p1x = left + width * 0.18 + seededOffset(seed, 1, roughness);
  const p1y = top + seededOffset(seed, 2, roughness * 0.7);

  const p2x = cx + seededOffset(seed, 3, roughness);
  const p2y = top + seededOffset(seed, 4, roughness * 0.85);

  const p3x = right - width * 0.16 + seededOffset(seed, 5, roughness);
  const p3y = top + height * 0.10 + seededOffset(seed, 6, roughness * 0.7);

  const p4x = right + seededOffset(seed, 7, roughness * 0.6);
  const p4y = cy - height * 0.16 + seededOffset(seed, 8, roughness);

  const p5x = right - width * 0.08 + seededOffset(seed, 9, roughness);
  const p5y = bottom - height * 0.14 + seededOffset(seed, 10, roughness * 0.8);

  const p6x = cx + seededOffset(seed, 11, roughness);
  const p6y = bottom + seededOffset(seed, 12, roughness * 0.65);

  const p7x = left + width * 0.14 + seededOffset(seed, 13, roughness);
  const p7y = bottom - height * 0.08 + seededOffset(seed, 14, roughness * 0.8);

  const p8x = left + seededOffset(seed, 15, roughness * 0.6);
  const p8y = cy + height * 0.12 + seededOffset(seed, 16, roughness);

  return [
    `M ${p1x} ${p1y}`,
    `C ${left + width * 0.35} ${top - height * 0.05}, ${cx - width * 0.10} ${top - height * 0.04}, ${p2x} ${p2y}`,
    `C ${cx + width * 0.12} ${top - height * 0.02}, ${right - width * 0.18} ${top + height * 0.02}, ${p3x} ${p3y}`,
    `C ${right + width * 0.05} ${cy - height * 0.05}, ${right + width * 0.03} ${cy + height * 0.06}, ${p4x} ${p4y}`,
    `C ${right + width * 0.02} ${cy + height * 0.16}, ${right - width * 0.01} ${bottom - height * 0.08}, ${p5x} ${p5y}`,
    `C ${cx + width * 0.15} ${bottom + height * 0.02}, ${cx - width * 0.06} ${bottom + height * 0.02}, ${p6x} ${p6y}`,
    `C ${cx - width * 0.20} ${bottom + height * 0.01}, ${left + width * 0.15} ${bottom - height * 0.01}, ${p7x} ${p7y}`,
    `C ${left - width * 0.02} ${cy + height * 0.10}, ${left - width * 0.04} ${cy - height * 0.02}, ${p8x} ${p8y}`,
    `C ${left - width * 0.03} ${cy - height * 0.18}, ${left + width * 0.04} ${top + height * 0.08}, ${p1x} ${p1y}`,
    "Z"
  ].join(" ");
}

function buildSeaPath(
  cx: number,
  cy: number,
  width: number,
  height: number,
  seedKey: string
): string {
  return buildBlobPath(cx, cy, width, height, `sea-${seedKey}`, Math.min(width, height) * 0.055);
}

function buildLandPath(
  cx: number,
  cy: number,
  width: number,
  height: number,
  seedKey: string
): string {
  return buildBlobPath(cx, cy, width, height, `land-${seedKey}`, Math.min(width, height) * 0.075);
}

function buildTerrainPath(
  cx: number,
  cy: number,
  width: number,
  height: number,
  seedKey: string
): string {
  return buildBlobPath(cx, cy, width, height, `terrain-${seedKey}`, Math.min(width, height) * 0.09);
}

export function buildOrganicPathForObject(object: RenderableMapObject): string | null {
  const cx = object.geometry.x ?? object.underlay?.anchorX ?? 0;
  const cy = object.geometry.y ?? object.underlay?.anchorY ?? 0;
  const { width, height } = getAdjustedDimensions(object);
  const seedKey = object.id;

  switch (object.renderLayer) {
    case "sea_underlay":
      return buildSeaPath(cx, cy, width, height, seedKey);

    case "land_underlay":
      return buildLandPath(cx, cy, width, height, seedKey);

    case "terrain_underlay":
      return buildTerrainPath(cx, cy, width, height, seedKey);

    default:
      return null;
  }
}

export function buildContourPathForObject(object: RenderableMapObject): string | null {
  const cx = object.geometry.x ?? object.underlay?.anchorX ?? 0;
  const cy = object.geometry.y ?? object.underlay?.anchorY ?? 0;
  const adjusted = getAdjustedDimensions(object);
  const width = adjusted.width * 0.78;
  const height = adjusted.height * 0.72;
  const seedKey = `${object.id}-contour`;

  switch (object.renderLayer) {
    case "sea_underlay":
    case "land_underlay":
    case "terrain_underlay":
      return buildBlobPath(cx, cy, width, height, seedKey, Math.min(width, height) * 0.05);

    default:
      return null;
  }
}

export function getFallbackRectDimensions(object: RenderableMapObject): {
  width: number;
  height: number;
} {
  return getAdjustedDimensions(object);
}