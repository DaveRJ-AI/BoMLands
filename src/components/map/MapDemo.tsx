import { useEffect, useMemo, useRef, useState } from "react";

import type {
  ChronologyPeriod,
  ToggleState,
  RenderDomain
} from "../../types/toggles";
import type { RenderDataset, RenderableMapObject } from "../../types/render";
import type {
  TierVisibilityFilters,
  CategoryVisibilityFilters
} from "../../data/transforms/prepareRenderableMapDataset";
import type { CoreDataset } from "../../data/loaders/loadCoreData";

import MapCanvas from "./MapCanvas";
import MapControls from "./MapControls";
import type { OverlayEventOption } from "./MapControls";
import LocationInspector from "./LocationInspector";
import { loadCoreData } from "../../data/loaders/loadCoreData";
import {
  buildLocationEvidenceDossier,
  buildRelationshipEvidenceDossier
} from "../../data/selectors/buildLocationEvidenceDossier";
import { prepareRenderableMapDataset } from "../../data/transforms/prepareRenderableMapDataset";

const DEFAULT_TOGGLES: ToggleState = {
  up_down_mode: "exclude",
  city_land_mode: "separate",
  inference_mode: "explicit_plus_strong",
  unnamed_regions_mode: "include",
  natural_features_mode: "include",
  border_claims_mode: "include",
  travel_edges_mode: "include",
  event_overlay_mode: "none",
  campaign_render_mode: "sequence_only"
};

const DEFAULT_CHRONOLOGY: ChronologyPeriod[] = [];
const DEFAULT_RENDER_DOMAIN: RenderDomain = "new_world_map";

const DEFAULT_TIER_FILTERS: TierVisibilityFilters = {
  tier1: true,
  tier2: true,
  tier3: true,
  tier4: true,
  tier5: true
};

const DEFAULT_CATEGORY_FILTERS: CategoryVisibilityFilters = {
  cities: true,
  lands: true,
  waters: true,
  landmarks: true
};

const RENDER_DOMAIN_LABELS: Record<RenderDomain, string> = {
  new_world_map: "New World Map",
  old_world_map: "Old World Map",
  jaredite_map: "Jaredite Map",
  transition: "Transition Layer"
};

const CHRONOLOGY_LABELS: Record<ChronologyPeriod, string> = {
  jaredite: "Jaredites",
  pre_christ: "Pre-Christ Visit",
  destruction: "Destruction",
  post_christ: "Post-Christ Visit"
};

type SearchOption = {
  id: string;
  label: string;
  subtitle: string;
};

type PlacementCoordinate = {
  x: number;
  y: number;
};

type SelectionFocusMode =
  | "all_visible"
  | "selected_only"
  | "selected_and_related"
  | "selected_and_related_only";

const SELECTION_FOCUS_LABELS: Record<SelectionFocusMode, string> = {
  all_visible: "All visible",
  selected_only: "Selected only",
  selected_and_related: "Selected + Related",
  selected_and_related_only: "Selected + Related Only"
};

function pillClass(active: boolean): string {
  return active
    ? "rounded-full border border-slate-900 bg-slate-900 px-3 py-1.5 text-sm font-semibold text-white shadow-sm"
    : "rounded-full border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-600 hover:border-slate-400 hover:bg-slate-50";
}

function getSelectedObject(
  objects: RenderableMapObject[],
  selectedObjectId?: string | null
): RenderableMapObject | null {
  if (!selectedObjectId) return null;
  return objects.find((object) => object.id === selectedObjectId) ?? null;
}

function getObjectLabel(object: RenderableMapObject): string {
  return object.metadata?.displayName ?? object.style.label ?? object.sourceId ?? object.id;
}

function normalizeSearchText(value: string): string {
  return value.toLowerCase().trim().replace(/\s+/g, " ");
}

function buildSearchSubtitle(object: RenderableMapObject): string {
  const feature = object.featureType ? String(object.featureType) : "unknown";
  const period = object.primaryPeriod ?? "unknown";
  return `${feature} • ${period}`;
}

function isSearchableObject(object: RenderableMapObject): boolean {
  if (!object) return false;
  if (object.style?.visible === false) return false;
  if (object.renderLayer === "claim_line" || object.renderLayer === "overlay_path") {
    return false;
  }
  return true;
}

export default function MapDemo() {
  const [toggles, setToggles] = useState<ToggleState>(DEFAULT_TOGGLES);
  const [selectedChronology, setSelectedChronology] =
    useState<ChronologyPeriod[]>(DEFAULT_CHRONOLOGY);
  const [selectedRenderDomain, setSelectedRenderDomain] =
    useState<RenderDomain>(DEFAULT_RENDER_DOMAIN);
  const [tierFilters, setTierFilters] =
    useState<TierVisibilityFilters>(DEFAULT_TIER_FILTERS);
  const [categoryFilters, setCategoryFilters] =
    useState<CategoryVisibilityFilters>(DEFAULT_CATEGORY_FILTERS);
  const [renderDataset, setRenderDataset] = useState<RenderDataset>({ objects: [] });
  const [coreDataset, setCoreDataset] = useState<CoreDataset | null>(null);
  const [selectedObjectId, setSelectedObjectId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [searchText, setSearchText] = useState<string>("");
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [activeSearchIndex, setActiveSearchIndex] = useState<number>(-1);
  const [selectionFocusMode, setSelectionFocusMode] =
    useState<SelectionFocusMode>("all_visible");
  const [showRelationshipLines, setShowRelationshipLines] = useState<boolean>(false);
  const [selectedOverlayEventId, setSelectedOverlayEventId] = useState<string>("all");
  const [selectedRelationshipLocationId, setSelectedRelationshipLocationId] =
    useState<string | null>(null);
  const [placementAssistEnabled, setPlacementAssistEnabled] = useState<boolean>(false);
  const [placementCoordinate, setPlacementCoordinate] =
    useState<PlacementCoordinate | null>(null);
  const searchContainerRef = useRef<HTMLDivElement | null>(null);
  const searchOptionRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  const safeSelectedChronology: ChronologyPeriod[] = Array.isArray(selectedChronology)
    ? selectedChronology
    : [];

  const safeRenderDataset: RenderDataset =
    renderDataset && Array.isArray(renderDataset.objects)
      ? renderDataset
      : { objects: [] };

  const searchableOptions = useMemo<SearchOption[]>(() => {
    const seen = new Set<string>();

    return safeRenderDataset.objects
      .filter(isSearchableObject)
      .map((object) => ({
        id: object.id,
        label: getObjectLabel(object),
        subtitle: buildSearchSubtitle(object)
      }))
      .filter((option) => {
        const key = `${option.id}::${option.label}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [safeRenderDataset.objects]);

  const filteredOptions = useMemo<SearchOption[]>(() => {
    const query = normalizeSearchText(searchText);

    if (!query) {
      return searchableOptions.slice(0, 12);
    }

    const startsWithMatches: SearchOption[] = [];
    const includesMatches: SearchOption[] = [];

    for (const option of searchableOptions) {
      const label = normalizeSearchText(option.label);
      const subtitle = normalizeSearchText(option.subtitle);

      if (label.startsWith(query)) {
        startsWithMatches.push(option);
      } else if (label.includes(query) || subtitle.includes(query)) {
        includesMatches.push(option);
      }
    }

    return [...startsWithMatches, ...includesMatches].slice(0, 12);
  }, [searchText, searchableOptions]);

  useEffect(() => {
    if (!isSearchOpen || filteredOptions.length === 0) {
      setActiveSearchIndex(-1);
      return;
    }

    setActiveSearchIndex((current) => {
      if (current < 0) return 0;
      return Math.min(current, filteredOptions.length - 1);
    });
  }, [filteredOptions, isSearchOpen]);

  useEffect(() => {
    if (!isSearchOpen || activeSearchIndex < 0) return;

    const activeOption = filteredOptions[activeSearchIndex];
    if (!activeOption) return;

    searchOptionRefs.current[activeOption.id]?.scrollIntoView({
      block: "nearest"
    });
  }, [activeSearchIndex, filteredOptions, isSearchOpen]);

  const selectedObject = useMemo(
    () => getSelectedObject(safeRenderDataset.objects, selectedObjectId),
    [safeRenderDataset.objects, selectedObjectId]
  );

  const selectedLocationDossier = useMemo(() => {
    if (!coreDataset || !selectedObject) return null;
    if (selectedObject.sourceType !== "location") return null;

    return buildLocationEvidenceDossier(
      coreDataset,
      selectedObject.metadata?.mergedSourceIds ?? selectedObject.sourceId
    );
  }, [coreDataset, selectedObject]);

  const selectedRelationship = useMemo(() => {
    if (!coreDataset || !selectedObject || selectedObject.sourceType !== "location") {
      return null;
    }

    if (!selectedRelationshipLocationId) {
      return null;
    }

    return buildRelationshipEvidenceDossier(
      coreDataset,
      selectedLocationDossier?.sourceLocationIds ?? selectedObject.sourceId,
      selectedRelationshipLocationId
    );
  }, [coreDataset, selectedLocationDossier, selectedObject, selectedRelationshipLocationId]);

  const focusedLocationIds = useMemo(() => {
    if (!selectedObject || selectedObject.sourceType !== "location") {
      return null;
    }

    const selectedIds = new Set(
      selectedLocationDossier?.sourceLocationIds ?? [selectedObject.sourceId]
    );
    const relatedIds = new Set(
      selectedLocationDossier?.relatedLocations.map((location) => location.id) ?? []
    );

    switch (selectionFocusMode) {
      case "selected_only":
        return new Set([...selectedIds]);
      case "selected_and_related":
        return new Set([...selectedIds, ...relatedIds]);
      case "selected_and_related_only":
        return new Set([...selectedIds, ...relatedIds]);
      case "all_visible":
      default:
        return null;
    }
  }, [selectedLocationDossier, selectedObject, selectionFocusMode]);

  const displayRenderDataset = useMemo<RenderDataset>(() => {
    const baseDataset = !focusedLocationIds
      ? safeRenderDataset
      : selectionFocusMode === "selected_and_related"
        ? {
            objects: safeRenderDataset.objects.map((object): RenderableMapObject => {
              if (
                object.shapeType === "underlay_asset" ||
                object.renderLayer === "background"
              ) {
                return object;
              }

              if (object.sourceType !== "location") {
                return object;
              }

              if (focusedLocationIds.has(object.sourceId)) {
                return object;
              }

              return {
                ...object,
                style: {
                  ...object.style,
                  opacity: 0.4
                },
                metadata: {
                  ...object.metadata,
                  labelPriority: "hidden" as const
                }
              };
            })
          }
        : {
            objects: safeRenderDataset.objects.filter((object) => {
              if (
                object.shapeType === "underlay_asset" ||
                object.renderLayer === "background"
              ) {
                return true;
              }

              if (object.sourceType !== "location") {
                return false;
              }

              return focusedLocationIds.has(object.sourceId);
            })
          };

    if (
      !showRelationshipLines ||
      !selectedObject ||
      selectedObject.sourceType !== "location" ||
      !selectedLocationDossier
    ) {
      return baseDataset;
    }

    const visibleLocationObjects = new Map(
      baseDataset.objects
        .filter((object) => object.sourceType === "location")
        .map((object) => [object.sourceId, object] as const)
    );

    const relationshipObjects = new Map<string, RenderableMapObject>();
    const selectedSourceIds = new Set(
      selectedLocationDossier.sourceLocationIds ?? [selectedObject.sourceId]
    );

    for (const claim of selectedLocationDossier.claims) {
      const selectedLocationObject = visibleLocationObjects.get(selectedObject.sourceId);
      const subjectSelected = selectedSourceIds.has(claim.subject_location_id);
      const objectSelected = selectedSourceIds.has(claim.object_location_id);

      if (subjectSelected && objectSelected) {
        continue;
      }

      const otherLocationId = subjectSelected
        ? claim.object_location_id
        : claim.subject_location_id;
      const otherLocationObject = visibleLocationObjects.get(otherLocationId);

      if (
        !selectedLocationObject ||
        !otherLocationObject ||
        typeof selectedLocationObject.geometry.x !== "number" ||
        typeof selectedLocationObject.geometry.y !== "number" ||
        typeof otherLocationObject.geometry.x !== "number" ||
        typeof otherLocationObject.geometry.y !== "number"
      ) {
        continue;
      }

      const relationshipId = `relationship_line_${selectedObject.sourceId}_${otherLocationId}`;
      const existing = relationshipObjects.get(relationshipId);

      if (existing) {
        existing.metadata = {
          ...existing.metadata,
          relationshipClaimIds: [
            ...(existing.metadata?.relationshipClaimIds ?? []),
            claim.claim_id
          ]
        };
        continue;
      }

      relationshipObjects.set(relationshipId, {
        id: relationshipId,
        sourceId: relationshipId,
        sourceType: "claim",
        shapeType: "line",
        renderLayer: "claim_line",
        chronologyPeriods: claim.chronology.periods,
        primaryPeriod: claim.chronology.primary_period,
        geometry: {
          points: [
            {
              x: selectedLocationObject.geometry.x,
              y: selectedLocationObject.geometry.y
            },
            {
              x: otherLocationObject.geometry.x,
              y: otherLocationObject.geometry.y
            }
          ]
        },
        style: {
          visible: true,
          opacity: 0.85,
          selectable: true,
          selected: false,
          muted: false,
          dashed: true,
          strokeWidth: 3,
          zIndex: 48,
          label: `Relationship to ${otherLocationObject.metadata?.displayName ?? otherLocationId}`
        },
        metadata: {
          displayName: `Relationship to ${otherLocationObject.metadata?.displayName ?? otherLocationId}`,
          mapRole: "relationship_visualization",
          renderDomain: selectedObject.metadata?.renderDomain,
          relationshipLocationId: otherLocationId,
          relationshipClaimIds: [claim.claim_id],
          notes: "Temporary visual relationship line from the selected location to a related location."
        }
      });
    }

    return {
      objects: [...baseDataset.objects, ...relationshipObjects.values()]
    };
  }, [
    focusedLocationIds,
    safeRenderDataset,
    selectionFocusMode,
    selectedLocationDossier,
    selectedObject,
    showRelationshipLines
  ]);

  const requestKey = useMemo(
    () =>
      JSON.stringify({
        toggles,
        selectedChronology: safeSelectedChronology,
        selectedRenderDomain,
        tierFilters,
        categoryFilters,
        selectedOverlayEventId
      }),
    [
      toggles,
      safeSelectedChronology,
      selectedRenderDomain,
      tierFilters,
      categoryFilters,
      selectedOverlayEventId
    ]
  );

  const overlayEventOptions = useMemo<OverlayEventOption[]>(() => {
    if (!coreDataset) return [];

    const locationDomainById = new Map(
      coreDataset.locations.map((location) => [location.id, location.render_domain] as const)
    );
    const stepsByEventId = new Map<string, typeof coreDataset.eventSteps>();

    for (const step of coreDataset.eventSteps) {
      const current = stepsByEventId.get(step.event_id) ?? [];
      current.push(step);
      stepsByEventId.set(step.event_id, current);
    }

    const filtered = coreDataset.events.filter((event) => {
      if (toggles.event_overlay_mode === "none") {
        return false;
      }

      if (toggles.event_overlay_mode !== "all") {
        const matchesType =
          toggles.event_overlay_mode === "missionary"
            ? event.event_type === "missionary_journey"
            : toggles.event_overlay_mode === "military"
              ? event.event_type === "military_campaign"
              : event.event_type === "migration";

        if (!matchesType) {
          return false;
        }
      }

      const steps = stepsByEventId.get(event.event_id) ?? [];
      if (steps.length === 0) return false;

      return steps.some((step) => {
        const fromDomain = locationDomainById.get(step.from_location_id);
        const toDomain = locationDomainById.get(step.to_location_id);
        return fromDomain === selectedRenderDomain && toDomain === selectedRenderDomain;
      });
    });

    return filtered
      .map((event) => ({ id: event.event_id, label: event.event_name }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [coreDataset, selectedRenderDomain, toggles.event_overlay_mode]);

  useEffect(() => {
    if (
      selectedOverlayEventId !== "all" &&
      !overlayEventOptions.some((option) => option.id === selectedOverlayEventId)
    ) {
      setSelectedOverlayEventId("all");
    }
  }, [overlayEventOptions, selectedOverlayEventId]);

  useEffect(() => {
    let isCancelled = false;

    async function run() {
      try {
        const nextCoreDataset = await loadCoreData();

        if (!isCancelled) {
          setCoreDataset(nextCoreDataset);
        }
      } catch (error) {
        if (!isCancelled) {
          const message =
            error instanceof Error ? error.message : "Unknown error loading core evidence data.";
          setErrorMessage(message);
        }
      }
    }

    run();

    return () => {
      isCancelled = true;
    };
  }, []);

  useEffect(() => {
    let isCancelled = false;

    async function run() {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const nextDataset = await prepareRenderableMapDataset({
          toggles,
          selectedChronology: safeSelectedChronology,
          selectedRenderDomain,
          tierFilters,
          categoryFilters,
          selectedOverlayEventId
        });

        if (!isCancelled) {
          setRenderDataset(
            nextDataset && Array.isArray(nextDataset.objects)
              ? nextDataset
              : { objects: [] }
          );
        }
      } catch (error) {
        if (!isCancelled) {
          const message =
            error instanceof Error ? error.message : "Unknown error preparing map dataset.";
          setErrorMessage(message);
          setRenderDataset({ objects: [] });
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    }

    run();

    return () => {
      isCancelled = true;
    };
  }, [
    requestKey,
    toggles,
    safeSelectedChronology,
    selectedRenderDomain,
    tierFilters,
    categoryFilters,
    selectedOverlayEventId
  ]);

  useEffect(() => {
    if (!selectedObjectId) return;

    const stillExists = safeRenderDataset.objects.some(
      (object) => object.id === selectedObjectId
    );

    if (!stillExists) {
      setSelectedObjectId(null);
    }
  }, [safeRenderDataset.objects, selectedObjectId]);

  useEffect(() => {
    if (!selectedObject) return;
    setSearchText(getObjectLabel(selectedObject));
  }, [selectedObject]);

  useEffect(() => {
    setSelectedRelationshipLocationId(null);
  }, [selectedObjectId, selectedRenderDomain, showRelationshipLines]);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (searchContainerRef.current?.contains(target)) return;

      setIsSearchOpen(false);
      setActiveSearchIndex(-1);
      setSearchText((current) => {
        if (!current.trim()) return "";
        return selectedObject ? getObjectLabel(selectedObject) : "";
      });
    }

    document.addEventListener("mousedown", handlePointerDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
    };
  }, [selectedObject]);

  function handleToggleChange<K extends keyof ToggleState>(
    key: K,
    value: ToggleState[K]
  ) {
    setToggles((prev) => ({
      ...prev,
      [key]: value
    }));
  }

  function handleChronologyChange(periods: ChronologyPeriod[]) {
    setSelectedChronology(Array.isArray(periods) ? periods : []);
  }

  function handleReset() {
    setToggles(DEFAULT_TOGGLES);
    setSelectedChronology(DEFAULT_CHRONOLOGY);
    setSelectedRenderDomain(DEFAULT_RENDER_DOMAIN);
    setTierFilters(DEFAULT_TIER_FILTERS);
    setCategoryFilters(DEFAULT_CATEGORY_FILTERS);
    setSelectedObjectId(null);
    setSelectedRelationshipLocationId(null);
    setSelectionFocusMode("all_visible");
    setShowRelationshipLines(false);
    setSelectedOverlayEventId("all");
    setPlacementAssistEnabled(false);
    setPlacementCoordinate(null);
    setSearchText("");
    setIsSearchOpen(false);
    setActiveSearchIndex(-1);
  }

  useEffect(() => {
    if (!placementAssistEnabled) {
      setPlacementCoordinate(null);
    }
  }, [placementAssistEnabled]);

  useEffect(() => {
    setPlacementCoordinate(null);
  }, [selectedObjectId, selectedRenderDomain]);

  function toggleTier(key: keyof TierVisibilityFilters) {
    setTierFilters((prev) => ({
      ...prev,
      [key]: !prev[key]
    }));
  }

  function toggleCategory(key: keyof CategoryVisibilityFilters) {
    setCategoryFilters((prev) => ({
      ...prev,
      [key]: !prev[key]
    }));
  }

  function clearChronology() {
    setSelectedChronology([]);
  }

  function toggleChronology(period: ChronologyPeriod) {
    setSelectedChronology((prev) =>
      prev.includes(period) ? prev.filter((value) => value !== period) : [...prev, period]
    );
  }

  function handleSelectSearchOption(option: SearchOption) {
    setSelectedRelationshipLocationId(null);
    setSelectedObjectId(option.id);
    setSearchText(option.label);
    setIsSearchOpen(false);
    setActiveSearchIndex(-1);
  }

  return (
    <div className="min-h-screen bg-slate-100 p-4 xl:p-6">
      <div className="mx-auto max-w-[1800px] space-y-4">
        <header className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-semibold text-slate-900">
            Book of Mormon Internal Geography Map
          </h1>
          <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-600">
            This map functions as a relational geography workboard:
            marker-based positioning, chronology review, tier/category filtering,
            and live location search to see and interact with the map in powerful ways.
          </p>
        </header>

        {errorMessage ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 shadow-sm">
            <span className="font-medium">Map load error:</span> {errorMessage}
          </div>
        ) : null}

        <div className="grid gap-4 xl:grid-cols-[320px_minmax(0,1fr)_340px]">
          <aside className="sticky top-6 space-y-4 self-start">
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
              <div className="mb-2 text-sm font-medium text-slate-800">Active map</div>

              <div className="flex flex-wrap gap-2">
                {(Object.keys(RENDER_DOMAIN_LABELS) as RenderDomain[]).map((domain) => {
                  const isActive = selectedRenderDomain === domain;

                  return (
                    <button
                      key={domain}
                      type="button"
                      onClick={() => {
                        setSelectedRenderDomain(domain);
                        setTierFilters({
                          tier1: true,
                          tier2: true,
                          tier3: true,
                          tier4: true,
                          tier5: true
                        });
                        setSelectedObjectId(null);
                        setSelectedRelationshipLocationId(null);
                      }}
                      className={pillClass(isActive)}
                    >
                      {isActive ? `✓ ${RENDER_DOMAIN_LABELS[domain]}` : RENDER_DOMAIN_LABELS[domain]}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
              <div className="mb-2 flex items-center justify-between gap-3">
                <div className="text-sm font-medium text-slate-800">Chronology review</div>
                <button
                  type="button"
                  onClick={clearChronology}
                  className="rounded-full border border-slate-300 px-3 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50"
                >
                  Show all eras
                </button>
              </div>

              <div className="text-xs text-slate-500">
                No era selected = show all available periods in the current map.
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {(
                  coreDataset?.appConfig.available_chronology_periods ?? [
                    "jaredite",
                    "pre_christ",
                    "destruction",
                    "post_christ"
                  ]
                ).map((period) => {
                  const active = safeSelectedChronology.includes(period);
                  const label =
                    coreDataset?.appConfig.chronology_labels?.[period] ?? CHRONOLOGY_LABELS[period];

                  return (
                    <button
                      key={period}
                      type="button"
                      onClick={() => toggleChronology(period)}
                      className={pillClass(active)}
                    >
                      {active ? `✓ ${label}` : label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
              <div className="mb-2 text-sm font-medium text-slate-800">Map Layers</div>

              <div className="flex flex-wrap gap-2">
                {(
                  [
                    ["tier1", "Anchors"],
                    ["tier2", "Major"],
                    ["tier3", "Supporting"],
                    ["tier4", "Detail"],
                    ["tier5", "Placeholder"]
                  ] as Array<[keyof TierVisibilityFilters, string]>
                ).map(([key, label]) => {
                  const active = tierFilters[key];

                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => toggleTier(key)}
                      className={pillClass(active)}
                    >
                      {active ? `✓ ${label}` : label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
              <div className="mb-2 text-sm font-medium text-slate-800">Category filters</div>

              <div className="flex flex-wrap gap-2">
                {(
                  [
                    ["cities", "Cities"],
                    ["lands", "Lands / Regions"],
                    ["waters", "Waters"],
                    ["landmarks", "Landmarks"]
                  ] as Array<[keyof CategoryVisibilityFilters, string]>
                ).map(([key, label]) => {
                  const active = categoryFilters[key];

                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => toggleCategory(key)}
                      className={pillClass(active)}
                    >
                      {active ? `✓ ${label}` : label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
              <div className="mb-2 text-sm font-medium text-slate-800">Placement assist</div>

              <button
                type="button"
                onClick={() => setPlacementAssistEnabled((current) => !current)}
                className={pillClass(placementAssistEnabled)}
              >
                {placementAssistEnabled ? "✓ Coordinate probe" : "Coordinate probe"}
              </button>

              <div className="mt-3 text-xs leading-5 text-slate-500">
                {placementAssistEnabled
                  ? selectedObject && selectedObject.sourceType === "location"
                    ? "Move the mouse over the map to read exact map-space x,y coordinates for the selected location."
                    : "Select a location first, then move the mouse over the map to read exact x,y coordinates."
                  : "Turn this on to read exact x,y map coordinates while placing locations."}
              </div>

              {placementAssistEnabled ? (
                <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                  <div className="font-medium text-slate-800">
                    {selectedObject && selectedObject.sourceType === "location"
                      ? getObjectLabel(selectedObject)
                      : "No location selected"}
                  </div>

                  <div className="mt-2 font-mono text-xs text-slate-600">
                    {placementCoordinate
                      ? `x: ${placementCoordinate.x}, y: ${placementCoordinate.y}`
                      : "x: -, y: -"}
                  </div>
                </div>
              ) : null}
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
              <div className="mb-2 text-sm font-medium text-slate-800">Selection focus</div>

              <div className="flex flex-wrap gap-2">
                {(
                  [
                    "all_visible",
                    "selected_only",
                    "selected_and_related",
                    "selected_and_related_only"
                  ] as SelectionFocusMode[]
                ).map((mode) => {
                  const needsSelection = mode !== "all_visible";
                  const disabled = needsSelection && !selectedObject;

                  return (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setSelectionFocusMode(mode)}
                      disabled={disabled}
                      className={`${pillClass(selectionFocusMode === mode)} ${
                        disabled ? "cursor-not-allowed opacity-50" : ""
                      }`}
                    >
                      {SELECTION_FOCUS_LABELS[mode]}
                    </button>
                  );
                })}
              </div>

              <div className="mt-3">
                <button
                  type="button"
                  onClick={() => setShowRelationshipLines((current) => !current)}
                  disabled={!selectedObject || selectedObject.sourceType !== "location"}
                  className={`${pillClass(showRelationshipLines)} ${
                    !selectedObject || selectedObject.sourceType !== "location"
                      ? "cursor-not-allowed opacity-50"
                      : ""
                  }`}
                >
                  {showRelationshipLines ? "✓ Relationship Lines" : "Relationship Lines"}
                </button>
              </div>

              <div className="mt-2 text-xs leading-5 text-slate-500">
                {selectedObject
                  ? "Filter the map to the selected location and the locations shown in the Related Locations section. Relationship lines can be turned on to visualize claim-connected locations."
                  : "Select a location first to focus the map on that node and its related locations."}
              </div>
            </div>

            <MapControls
              toggles={toggles}
              selectedChronology={safeSelectedChronology}
              overlayEventOptions={overlayEventOptions}
              selectedOverlayEventId={selectedOverlayEventId}
              onSelectedOverlayEventIdChange={setSelectedOverlayEventId}
              onToggleChange={handleToggleChange}
              onChronologyChange={handleChronologyChange}
              onReset={handleReset}
            />

            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
              <button
                type="button"
                onClick={handleReset}
                className="w-full rounded-full border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Reset all controls
              </button>
            </div>
          </aside>

          <main className="min-w-0 space-y-4">
            <MapCanvas
              renderDataset={displayRenderDataset}
              selectedObjectId={selectedObjectId}
              highlightedObjectIds={
                selectedRelationshipLocationId && selectedObject?.sourceType === "location"
                  ? [`relationship_line_${selectedObject.sourceId}_${selectedRelationshipLocationId}`]
                  : []
              }
              onSelectObject={(objectId) => {
                const clickedObject = displayRenderDataset.objects.find(
                  (object) => object.id === objectId
                );

                if (clickedObject?.metadata?.mapRole === "relationship_visualization") {
                  const otherLocationId = clickedObject.metadata.relationshipLocationId;
                  setSelectedRelationshipLocationId((current) =>
                    current === otherLocationId ? null : otherLocationId ?? null
                  );
                  return;
                }

                setSelectedRelationshipLocationId(null);
                setSelectedObjectId(objectId);
              }}
              onClearSelection={() => {
                setSelectedRelationshipLocationId(null);
                setSelectedObjectId(null);
              }}
              title={`${RENDER_DOMAIN_LABELS[selectedRenderDomain]} Preview`}
              toolbarContent={
                <div ref={searchContainerRef} className="relative">
                  <label
                    htmlFor="map-location-search"
                    className="mb-2 block text-sm font-medium text-slate-800"
                  >
                    Find a location
                  </label>

                  <div className="flex gap-2">
                    <input
                      id="map-location-search"
                      type="text"
                      value={searchText}
                      onChange={(event) => {
                        setSearchText(event.target.value);
                        setIsSearchOpen(true);
                        setActiveSearchIndex(0);
                      }}
                      onKeyDown={(event) => {
                        if (event.key === "ArrowDown") {
                          event.preventDefault();
                          if (!isSearchOpen) {
                            setIsSearchOpen(true);
                            setActiveSearchIndex(0);
                            return;
                          }

                          setActiveSearchIndex((current) =>
                            filteredOptions.length === 0
                              ? -1
                              : Math.min(current + 1, filteredOptions.length - 1)
                          );
                          return;
                        }

                        if (event.key === "ArrowUp") {
                          event.preventDefault();
                          if (!isSearchOpen) {
                            setIsSearchOpen(true);
                            setActiveSearchIndex(
                              filteredOptions.length > 0 ? filteredOptions.length - 1 : -1
                            );
                            return;
                          }

                          setActiveSearchIndex((current) =>
                            filteredOptions.length === 0 ? -1 : Math.max(current - 1, 0)
                          );
                          return;
                        }

                        if (event.key === "Enter" && isSearchOpen && activeSearchIndex >= 0) {
                          event.preventDefault();
                          const activeOption = filteredOptions[activeSearchIndex];
                          if (activeOption) {
                            handleSelectSearchOption(activeOption);
                          }
                          return;
                        }

                        if (event.key === "Escape") {
                          setIsSearchOpen(false);
                          setActiveSearchIndex(-1);
                          setSearchText(selectedObject ? getObjectLabel(selectedObject) : "");
                          (event.target as HTMLInputElement).blur();
                        }
                      }}
                      onFocus={() => setIsSearchOpen(true)}
                      placeholder="Start typing a place name..."
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:border-slate-400"
                    />

                    <button
                      type="button"
                      onClick={() => {
                        setSearchText("");
                        setIsSearchOpen(false);
                        setSelectedObjectId(null);
                        setSelectedRelationshipLocationId(null);
                      }}
                      className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
                    >
                      Clear
                    </button>
                  </div>

                  {isSearchOpen && filteredOptions.length > 0 ? (
                    <div className="absolute left-0 right-0 top-[88px] z-20 max-h-80 overflow-auto rounded-2xl border border-slate-200 bg-white shadow-xl">
                      {filteredOptions.map((option) => (
                        <button
                          key={option.id}
                          ref={(element) => {
                            searchOptionRefs.current[option.id] = element;
                          }}
                          type="button"
                          onClick={() => handleSelectSearchOption(option)}
                          className={`flex w-full items-start justify-between gap-4 px-4 py-3 text-left hover:bg-slate-50 ${
                            selectedObjectId === option.id ||
                            filteredOptions[activeSearchIndex]?.id === option.id
                              ? "bg-slate-50"
                              : "bg-white"
                          }`}
                        >
                          <div>
                            <div className="text-sm font-medium text-slate-900">
                              {option.label}
                            </div>
                            <div className="mt-1 text-xs text-slate-500">{option.subtitle}</div>
                          </div>

                          {selectedObjectId === option.id ? (
                            <div className="rounded-full bg-slate-900 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-white">
                              Selected
                            </div>
                          ) : null}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
              }
              tierFilters={tierFilters}
              placementAssistEnabled={
                placementAssistEnabled &&
                !!selectedObject &&
                selectedObject.sourceType === "location"
              }
              onPlacementCoordinateChange={setPlacementCoordinate}
            />
          </main>

          <LocationInspector
            selectedObject={selectedObject}
            dossier={selectedLocationDossier}
            selectedRelationship={selectedRelationship}
            isEvidenceLoading={!coreDataset && !errorMessage}
          />
        </div>
      </div>
    </div>
  );
}
