import { useState } from "react";
import type { ReactNode } from "react";

import type { EventStepRecord } from "../../types/event";
import type { LocationMention } from "../../types/locationMention";
import type { RenderableMapObject } from "../../types/render";
import type { SpatialClaim } from "../../types/spatialClaim";
import type {
  LocationEvidenceDossier,
  LocationEvidenceReference,
  RelationshipEvidenceDossier
} from "../../data/selectors/buildLocationEvidenceDossier";
import {
  classifyMentionUsefulness,
  normalizeMentionText
} from "../../data/utils/locationMentionIntegrity";

type ReferenceRelevance = "relational" | "contextual" | "ambiguous" | "incidental";
type ReferenceFilterMode =
  | "placement"
  | "relational"
  | "contextual"
  | "ambiguous"
  | "incidental"
  | "all";

function humanizeToken(value: string): string {
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function renderHighlightedText(text: string, phrases: string[]): ReactNode {
  const normalizedPhrases = Array.from(
    new Set(
      phrases
        .map((phrase) => normalizeMentionText(phrase).trim())
        .filter((phrase) => phrase.length > 0)
    )
  ).sort((a, b) => b.length - a.length);

  if (!text || normalizedPhrases.length === 0) {
    return text;
  }

  const pattern = normalizedPhrases.map(escapeRegExp).join("|");
  if (!pattern) {
    return text;
  }

  const regex = new RegExp(`(${pattern})`, "gi");
  const parts = text.split(regex);

  return parts.map((part, index) => {
    const isMatch = normalizedPhrases.some(
      (phrase) => part.toLowerCase() === phrase.toLowerCase()
    );

    if (isMatch) {
      return (
        <strong key={`${part}-${index}`} className="font-bold text-slate-900">
          {part}
        </strong>
      );
    }

    return <span key={`${part}-${index}`}>{part}</span>;
  });
}

function getClaimPerspectiveLabel(
  claim: SpatialClaim,
  selectedLocationId: string
): string {
  const labels: Record<string, string> = {
    north_of: "north of",
    south_of: "south of",
    east_of: "east of",
    west_of: "west of",
    near: "near",
    adjacent_to: "adjacent to",
    borders: "borders",
    between: "between",
    contains: "contains",
    within: "within",
    separated_by: "separated by",
    route_to: "route relation to",
    crosses: "crosses",
    coastal_to: "coastal to",
    upstream_from: "upstream from",
    downstream_from: "downstream from"
  };

  const inverses: Record<string, string> = {
    north_of: "south of",
    south_of: "north of",
    east_of: "west of",
    west_of: "east of",
    contains: "within",
    within: "contains",
    upstream_from: "downstream from",
    downstream_from: "upstream from"
  };

  if (claim.subject_location_id === selectedLocationId) {
    return labels[claim.claim_type] ?? humanizeToken(claim.claim_type);
  }

  return inverses[claim.claim_type] ?? labels[claim.claim_type] ?? humanizeToken(claim.claim_type);
}

function getOtherLocationLabel(
  claim: SpatialClaim,
  selectedLocationId: string,
  dossier: LocationEvidenceDossier
): string {
  const otherId =
    claim.subject_location_id === selectedLocationId
      ? claim.object_location_id
      : claim.subject_location_id;

  const relatedLocation = dossier.relatedLocations.find((location) => location.id === otherId);
  if (relatedLocation) return relatedLocation.display_name;

  if (dossier.location?.id === otherId) return dossier.location.display_name;

  return otherId;
}

function getMovementStepLabel(
  step: EventStepRecord,
  selectedLocationId: string,
  dossier: LocationEvidenceDossier
): string {
  const relatedLocationId =
    step.from_location_id === selectedLocationId
      ? step.to_location_id
      : step.from_location_id;

  const relatedLocation = dossier.relatedLocations.find(
    (location) => location.id === relatedLocationId
  );

  return relatedLocation?.display_name ?? relatedLocationId;
}

function InspectorRow({
  label,
  value
}: {
  label: string;
  value?: string | number | null;
}) {
  return (
    <div className="grid grid-cols-[120px_minmax(0,1fr)] gap-3 border-b border-slate-100 py-2 text-sm last:border-b-0">
      <div className="font-medium text-slate-600">{label}</div>
      <div className="text-slate-900">{value ?? "—"}</div>
    </div>
  );
}

function SectionTag({
  value,
  tone = "slate",
  onClick,
  active = false
}: {
  value: string;
  tone?: "slate" | "amber" | "blue" | "green";
  onClick?: () => void;
  active?: boolean;
}) {
  const toneClass =
    tone === "amber"
      ? "border-amber-200 bg-amber-50 text-amber-700"
      : tone === "blue"
        ? "border-blue-200 bg-blue-50 text-blue-700"
        : tone === "green"
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : "border-slate-200 bg-slate-50 text-slate-700";

  const activeClass = active ? "ring-2 ring-slate-300 ring-offset-1" : "";

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`rounded-full border px-2 py-1 text-[11px] font-medium transition hover:opacity-90 ${toneClass} ${activeClass}`}
      >
        {value}
      </button>
    );
  }

  return (
    <span className={`rounded-full border px-2 py-1 text-[11px] font-medium ${toneClass} ${activeClass}`}>
      {value}
    </span>
  );
}

function filterPillClass(active: boolean): string {
  return active
    ? "rounded-full border border-slate-900 bg-slate-900 px-3 py-1.5 text-sm font-semibold text-white shadow-sm"
    : "rounded-full border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-600 hover:border-slate-400 hover:bg-slate-50";
}

function getNodeKindTone(nodeKind?: string): "slate" | "amber" | "blue" | "green" {
  switch (nodeKind) {
    case "source_location":
      return "green";
    case "derived_overlay":
      return "blue";
    case "analytical_construct":
      return "amber";
    default:
      return "slate";
  }
}

function getEvidenceStatusTone(status?: string): "slate" | "amber" | "blue" | "green" {
  switch (status) {
    case "source_grounded":
      return "green";
    case "inference_supported":
      return "blue";
    case "analytical_abstract":
      return "amber";
    case "coverage_review_needed":
      return "amber";
    default:
      return "slate";
  }
}

function getNodeKindDescription(nodeKind?: string): string {
  switch (nodeKind) {
    case "source_location":
      return "This is treated as a source-grounded location node rather than a review-only overlay.";
    case "derived_overlay":
      return "This is a derived overlay built from recurring textual patterns or normalized regional framing, not a standalone source-named place.";
    case "analytical_construct":
      return "This is an analytical helper construct used for review or synthesis, not a direct map place from the source text.";
    default:
      return "Location classification has not been summarized yet.";
  }
}

function getEvidenceStatusDescription(status?: string): string {
  switch (status) {
    case "source_grounded":
      return "Evidence is primarily direct and text-grounded.";
    case "inference_supported":
      return "Evidence is useful and reviewable, but part of the location logic depends on inference or overlay framing.";
    case "analytical_abstract":
      return "This item should be read as interpretive scaffolding rather than direct geography.";
    case "coverage_review_needed":
      return "Coverage still needs review before this should be treated as settled.";
    default:
      return "Evidence status has not been summarized yet.";
  }
}

function getReferenceRelevance(entry: LocationEvidenceReference): ReferenceRelevance {
  const usefulnesses = entry.mentions.map((mention) => classifyMentionUsefulness(mention));

  if (usefulnesses.includes("relational")) {
    return "relational";
  }

  if (usefulnesses.includes("contextual")) {
    return "contextual";
  }

  if (usefulnesses.includes("ambiguous")) {
    return "ambiguous";
  }

  return "incidental";
}

function matchesReferenceFilter(
  entry: LocationEvidenceReference,
  filterMode: ReferenceFilterMode
): boolean {
  const relevance = getReferenceRelevance(entry);

  switch (filterMode) {
    case "relational":
      return relevance === "relational";
    case "contextual":
      return relevance === "contextual";
    case "ambiguous":
      return relevance === "ambiguous";
    case "incidental":
      return relevance === "incidental";
    case "placement":
      return relevance === "relational" || relevance === "contextual";
    case "all":
    default:
      return true;
  }
}

function getReferenceRelevanceTone(
  relevance: ReferenceRelevance
): "slate" | "amber" | "blue" | "green" {
  switch (relevance) {
    case "relational":
      return "green";
    case "contextual":
      return "blue";
    case "ambiguous":
      return "amber";
    case "incidental":
    default:
      return "slate";
  }
}

function getMentionUsefulnessTone(
  usefulness: ReferenceRelevance
): "slate" | "amber" | "blue" | "green" {
  return getReferenceRelevanceTone(usefulness);
}

function InspectorSection({
  title,
  subtitle,
  defaultOpen = false,
  children
}: {
  title: string;
  subtitle?: string;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white">
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className="w-full px-4 py-3 text-left"
      >
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-sm font-semibold text-slate-900">{title}</div>
            {subtitle ? <div className="mt-1 text-xs text-slate-500">{subtitle}</div> : null}
          </div>
          <span className="text-xs font-medium uppercase tracking-wide text-slate-400">
            {isOpen ? "Hide" : "Show"}
          </span>
        </div>
      </button>
      {isOpen ? <div className="border-t border-slate-100 px-4 py-4">{children}</div> : null}
    </section>
  );
}

function ReferenceEntry({
  entry,
  selectedLocationName,
  activeFilterMode,
  onSelectFilter
}: {
  entry: LocationEvidenceReference;
  selectedLocationName?: string;
  activeFilterMode: ReferenceFilterMode;
  onSelectFilter: (filterMode: ReferenceFilterMode) => void;
}) {
  const referenceRelevance = getReferenceRelevance(entry);
  const mentionRoles = Array.from(
    new Set(entry.mentions.map((mention) => humanizeToken(mention.mention_role)))
  );
  const certainties = Array.from(new Set(entry.mentions.map((mention) => mention.certainty)));
  const highlightPhrases = Array.from(
    new Set([
      ...(selectedLocationName ? [selectedLocationName] : []),
      ...entry.mentions.map((mention) => mention.matched_text)
    ])
  );

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="text-sm font-semibold text-slate-900">
          {entry.reference.reference_label}
        </div>
        <SectionTag
          value={`${humanizeToken(referenceRelevance)} reference`}
          tone={getReferenceRelevanceTone(referenceRelevance)}
          onClick={() => onSelectFilter(referenceRelevance)}
          active={activeFilterMode === referenceRelevance}
        />
        {mentionRoles.map((role) => (
          <SectionTag key={role} value={role} tone="blue" />
        ))}
        {certainties.map((certainty) => (
          <SectionTag key={certainty} value={`${certainty} certainty`} tone="green" />
        ))}
      </div>

      <div className="mt-2 text-sm leading-6 text-slate-700">
        {entry.sourceVerses.length > 0 ? (
          <div className="space-y-2">
            {entry.sourceVerses.map((verse) => (
              <div
                key={verse.id}
                className="rounded-xl border border-slate-200 bg-white px-3 py-3"
              >
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {verse.book} {verse.chapter}:{verse.verse}
                </div>
                <div className="mt-2 text-sm leading-6 text-slate-800">
                  {renderHighlightedText(verse.text, highlightPhrases)}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-3 text-sm text-amber-800">
            Canonical verse text was not matched for this extracted reference span.
          </div>
        )}
      </div>

      {entry.mentions.length > 0 ? (
        <div className="mt-3 space-y-2">
          {entry.mentions.map((mention: LocationMention) => {
            const usefulness = classifyMentionUsefulness(mention);

            return (
              <div
                key={mention.mention_id}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600"
              >
                <div className="flex flex-wrap gap-2">
                  <SectionTag
                    value={humanizeToken(mention.mention_role)}
                    tone="blue"
                  />
                  <SectionTag
                    value={`${humanizeToken(usefulness)} mention`}
                    tone={getMentionUsefulnessTone(usefulness)}
                    onClick={() => onSelectFilter(usefulness)}
                    active={activeFilterMode === usefulness}
                  />
                </div>
                <div className="mt-2">
                  <span className="font-semibold text-slate-700">Matched text:</span>{" "}
                  {renderHighlightedText(
                    normalizeMentionText(mention.matched_text),
                    highlightPhrases
                  )}
                </div>
                <div className="mt-1">
                  <span className="font-semibold text-slate-700">Surrounding phrase:</span>{" "}
                  {renderHighlightedText(mention.surrounding_phrase, highlightPhrases)}
                </div>
                {mention.notes ? (
                  <div className="mt-1">
                    <span className="font-semibold text-slate-700">Notes:</span>{" "}
                    {mention.notes}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      ) : null}

      <div className="mt-3 rounded-xl border border-slate-200 bg-white px-3 py-3 text-xs leading-6 text-slate-600">
        <div className="font-semibold text-slate-700">Extracted excerpt</div>
        <div className="mt-1">
          {renderHighlightedText(entry.reference.text_excerpt, highlightPhrases)}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">
        {entry.reference.context_type.map((contextType) => (
          <SectionTag key={contextType} value={humanizeToken(contextType)} />
        ))}
        {entry.reference.ambiguity_flags.map((flag) => (
          <SectionTag key={flag} value={humanizeToken(flag)} tone="amber" />
        ))}
      </div>
    </div>
  );
}

function ConsiderationList({
  title,
  items
}: {
  title: string;
  items: string[];
}) {
  return (
    <div>
      <div className="text-sm font-semibold text-slate-800">{title}</div>
      {items.length > 0 ? (
        <div className="mt-2 space-y-2">
          {items.map((item) => (
            <div
              key={item}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm leading-6 text-slate-700"
            >
              {item}
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-2 text-sm text-slate-500">No items recorded.</div>
      )}
    </div>
  );
}

export default function LocationInspector({
  selectedObject,
  dossier,
  selectedRelationship = null,
  isEvidenceLoading = false
}: {
  selectedObject: RenderableMapObject | null;
  dossier: LocationEvidenceDossier | null;
  selectedRelationship?: RelationshipEvidenceDossier | null;
  isEvidenceLoading?: boolean;
}) {
  if (!selectedObject) {
    return (
      <aside className="sticky top-6 max-h-[calc(100vh-1.5rem)] overflow-y-auto rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="text-base font-semibold text-slate-900">Selected location</h3>
        <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">
          Click a map point or use search to inspect its details.
        </div>
      </aside>
    );
  }

  const [referenceFilterMode, setReferenceFilterMode] =
    useState<ReferenceFilterMode>("placement");

  const filteredReferences = dossier
    ? dossier.references.filter((entry) => matchesReferenceFilter(entry, referenceFilterMode))
    : [];

  const referenceFilterCounts = dossier
    ? {
        relational: dossier.references.filter((entry) => getReferenceRelevance(entry) === "relational")
          .length,
        contextual: dossier.references.filter((entry) => getReferenceRelevance(entry) === "contextual")
          .length,
        ambiguous: dossier.references.filter((entry) => getReferenceRelevance(entry) === "ambiguous")
          .length,
        incidental: dossier.references.filter((entry) => getReferenceRelevance(entry) === "incidental")
          .length,
        placement: dossier.references.filter((entry) => {
          const relevance = getReferenceRelevance(entry);
          return relevance === "relational" || relevance === "contextual";
        }).length,
        all: dossier.references.length
      }
    : {
        relational: 0,
        contextual: 0,
        ambiguous: 0,
        incidental: 0,
        placement: 0,
        all: 0
      };

  return (
    <aside className="sticky top-6 max-h-[calc(100vh-1.5rem)] space-y-4 self-start overflow-y-auto pr-1">
      <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="text-base font-semibold text-slate-900">Selected location</h3>

        <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-3">
            <div className="text-lg font-semibold text-slate-900">
              {selectedObject.metadata?.displayName ?? selectedObject.id}
            </div>
            <div className="mt-1 text-xs uppercase tracking-wide text-slate-500">
              {selectedObject.sourceId}
            </div>
          </div>

          <div className="mb-4 rounded-2xl border border-slate-200 bg-slate-50 p-3">
            <div className="flex flex-wrap gap-2">
              {selectedObject.metadata?.nodeKind ? (
                <SectionTag
                  value={humanizeToken(selectedObject.metadata.nodeKind)}
                  tone={getNodeKindTone(selectedObject.metadata.nodeKind)}
                />
              ) : null}
              {selectedObject.metadata?.evidenceStatus ? (
                <SectionTag
                  value={humanizeToken(selectedObject.metadata.evidenceStatus)}
                  tone={getEvidenceStatusTone(selectedObject.metadata.evidenceStatus)}
                />
              ) : null}
              {selectedObject.metadata?.mergedSourceIds &&
              selectedObject.metadata.mergedSourceIds.length > 1 ? (
                <SectionTag value="Multi-Era Continuity Node" tone="blue" />
              ) : null}
            </div>
            <div className="mt-3 space-y-2 text-sm leading-6 text-slate-600">
              <div>{getNodeKindDescription(selectedObject.metadata?.nodeKind)}</div>
              <div>{getEvidenceStatusDescription(selectedObject.metadata?.evidenceStatus)}</div>
            </div>
          </div>

          <InspectorRow label="Feature type" value={selectedObject.featureType ?? "—"} />
          <InspectorRow label="Map role" value={selectedObject.metadata?.mapRole} />
          <InspectorRow
            label="Node kind"
            value={
              selectedObject.metadata?.nodeKind
                ? humanizeToken(selectedObject.metadata.nodeKind)
                : undefined
            }
          />
          <InspectorRow
            label="Evidence status"
            value={
              selectedObject.metadata?.evidenceStatus
                ? humanizeToken(selectedObject.metadata.evidenceStatus)
                : undefined
            }
          />
          <InspectorRow label="Tier" value={selectedObject.metadata?.visibilityTier} />
          <InspectorRow
            label="Chronology"
            value={selectedObject.chronologyPeriods.join(", ")}
          />
          <InspectorRow label="Primary period" value={selectedObject.primaryPeriod} />
          <InspectorRow
            label="First reference"
            value={selectedObject.metadata?.firstReference}
          />
          <InspectorRow label="Region scope" value={selectedObject.metadata?.regionScope} />
          <InspectorRow label="x" value={selectedObject.geometry.x ?? "—"} />
          <InspectorRow label="y" value={selectedObject.geometry.y ?? "—"} />

          <div className="pt-3">
            <div className="mb-2 text-sm font-medium text-slate-700">Linked entities</div>
            {selectedObject.metadata?.linkedEntities &&
            selectedObject.metadata.linkedEntities.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {selectedObject.metadata.linkedEntities.map((entity) => (
                  <span
                    key={entity}
                    className="rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-600"
                  >
                    {entity}
                  </span>
                ))}
              </div>
            ) : (
              <div className="text-sm text-slate-500">No linked entities listed.</div>
            )}
          </div>

          <div className="pt-4">
            <div className="mb-2 text-sm font-medium text-slate-700">Notes</div>
            <div className="rounded-2xl border border-slate-100 bg-slate-50 px-3 py-3 text-sm leading-6 text-slate-600">
              {selectedObject.metadata?.notes ?? "No notes available."}
            </div>
          </div>
        </div>
      </div>

      {dossier ? (
        <div key={selectedObject.sourceId} className="space-y-4">
          {selectedRelationship &&
          selectedRelationship.otherLocation &&
          selectedRelationship.claims.length > 0 ? (
            <InspectorSection
              title="Selected Relationship"
              subtitle="Clicked relationship line and the verse support behind it"
              defaultOpen
            >
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                  <div className="text-xs uppercase tracking-wide text-slate-500">
                    Supporting References
                  </div>
                  <div className="mt-1 text-2xl font-semibold text-slate-900">
                    {selectedRelationship.references.length}
                  </div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                  <div className="text-xs uppercase tracking-wide text-slate-500">
                    Supporting Mentions
                  </div>
                  <div className="mt-1 text-2xl font-semibold text-slate-900">
                    {selectedRelationship.references.reduce(
                      (count, entry) => count + entry.mentions.length,
                      0
                    )}
                  </div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                  <div className="text-xs uppercase tracking-wide text-slate-500">
                    Claims on This Line
                  </div>
                  <div className="mt-1 text-2xl font-semibold text-slate-900">
                    {selectedRelationship.claims.length}
                  </div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                  <div className="text-xs uppercase tracking-wide text-slate-500">
                    Related Event Steps
                  </div>
                  <div className="mt-1 text-2xl font-semibold text-slate-900">
                    {selectedRelationship.references.reduce(
                      (count, entry) => count + entry.relatedEventSteps.length,
                      0
                    )}
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                <div className="text-sm font-semibold text-slate-900">
                  {selectedRelationship.anchorLocation?.display_name ??
                    selectedObject.metadata?.displayName ??
                    selectedObject.id}{" "}
                  ↔ {selectedRelationship.otherLocation.display_name}
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {selectedRelationship.claims.map((claim) => (
                    <SectionTag
                      key={claim.claim_id}
                      value={humanizeToken(claim.claim_type)}
                      tone="blue"
                    />
                  ))}
                </div>
              </div>

              <div className="mt-4 space-y-3">
                {selectedRelationship.claims.map((claim) => (
                  <div
                    key={claim.claim_id}
                    className="rounded-2xl border border-slate-200 bg-white p-3 text-sm leading-6 text-slate-700"
                  >
                    <div className="flex flex-wrap gap-2">
                      <SectionTag value={humanizeToken(claim.claim_type)} tone="blue" />
                      <SectionTag value={humanizeToken(claim.claim_basis)} tone="amber" />
                      <SectionTag value={`${claim.confidence} confidence`} tone="green" />
                    </div>
                    {claim.source_phrase ? (
                      <div className="mt-2">{claim.source_phrase}</div>
                    ) : null}
                    {claim.notes ? <div className="mt-2 text-slate-500">{claim.notes}</div> : null}
                  </div>
                ))}
              </div>

              <div className="mt-4 space-y-3">
                {selectedRelationship.references.map((entry) => {
                  const highlightPhrases = Array.from(
                    new Set([
                      selectedRelationship.anchorLocation?.display_name ?? "",
                      selectedRelationship.otherLocation?.display_name ?? "",
                      ...entry.mentions.map((mention) => mention.matched_text)
                    ].filter(Boolean))
                  );

                  return (
                    <div
                      key={entry.reference.id}
                      className="rounded-2xl border border-slate-200 bg-slate-50 p-3"
                    >
                      <div className="text-sm font-semibold text-slate-900">
                        {entry.reference.reference_label}
                      </div>
                      <div className="mt-2 space-y-2 text-sm leading-6 text-slate-800">
                        {entry.sourceVerses.length > 0
                          ? entry.sourceVerses.map((verse) => (
                              <div
                                key={verse.id}
                                className="rounded-xl border border-slate-200 bg-white px-3 py-3"
                              >
                                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                  {verse.book} {verse.chapter}:{verse.verse}
                                </div>
                                <div className="mt-2">
                                  {renderHighlightedText(verse.text, highlightPhrases)}
                                </div>
                              </div>
                            ))
                          : (
                            <div className="rounded-xl border border-slate-200 bg-white px-3 py-3">
                              {renderHighlightedText(entry.reference.text_excerpt, highlightPhrases)}
                            </div>
                          )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </InspectorSection>
          ) : null}

          <InspectorSection
            title="Evidence Summary"
            subtitle="Quick counts and review signals for this location"
            defaultOpen
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                <div className="text-xs uppercase tracking-wide text-slate-500">References</div>
                <div className="mt-1 text-2xl font-semibold text-slate-900">
                  {dossier.summary.totalReferences}
                </div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                <div className="text-xs uppercase tracking-wide text-slate-500">Mentions</div>
                <div className="mt-1 text-2xl font-semibold text-slate-900">
                  {dossier.summary.totalMentions}
                </div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                <div className="text-xs uppercase tracking-wide text-slate-500">Claims</div>
                <div className="mt-1 text-2xl font-semibold text-slate-900">
                  {dossier.summary.totalClaims}
                </div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                <div className="text-xs uppercase tracking-wide text-slate-500">Event Steps</div>
                <div className="mt-1 text-2xl font-semibold text-slate-900">
                  {dossier.summary.totalEventSteps}
                </div>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <SectionTag
                value={`Node kind: ${humanizeToken(dossier.summary.nodeKind)}`}
                tone={getNodeKindTone(dossier.summary.nodeKind)}
              />
              <SectionTag
                value={`Evidence status: ${humanizeToken(dossier.summary.evidenceStatus)}`}
                tone={getEvidenceStatusTone(dossier.summary.evidenceStatus)}
              />
              <SectionTag
                value={`Text-driven evidence: ${dossier.summary.textDrivenStrength}`}
                tone="blue"
              />
              <SectionTag
                value={`Inference load: ${dossier.summary.inferenceLoad}`}
                tone="amber"
              />
              <SectionTag
                value={`Review status: ${dossier.summary.reviewStatus}`}
                tone="green"
              />
            </div>
          </InspectorSection>

          <InspectorSection
            title="All References"
            subtitle="Scripture-order evidence tied to this location, with relevance filtering"
            defaultOpen
          >
            <div className="mb-4 rounded-2xl border border-slate-200 bg-slate-50 p-3">
              <div className="text-sm font-semibold text-slate-800">Reference filter</div>
              <div className="mt-1 text-xs leading-5 text-slate-500">
                Default view favors placement-relevant references first. Expand to all when you
                want the full dossier.
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setReferenceFilterMode("placement")}
                  className={filterPillClass(referenceFilterMode === "placement")}
                >
                  Placement Relevant ({referenceFilterCounts.placement})
                </button>
                <button
                  type="button"
                  onClick={() => setReferenceFilterMode("relational")}
                  className={filterPillClass(referenceFilterMode === "relational")}
                >
                  Relational Only ({referenceFilterCounts.relational})
                </button>
                <button
                  type="button"
                  onClick={() => setReferenceFilterMode("all")}
                  className={filterPillClass(referenceFilterMode === "all")}
                >
                  All References ({referenceFilterCounts.all})
                </button>
              </div>
              <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">
                <SectionTag
                  value={`Relational ${referenceFilterCounts.relational}`}
                  tone="green"
                  onClick={() => setReferenceFilterMode("relational")}
                  active={referenceFilterMode === "relational"}
                />
                <SectionTag
                  value={`Contextual ${referenceFilterCounts.contextual}`}
                  tone="blue"
                  onClick={() => setReferenceFilterMode("contextual")}
                  active={referenceFilterMode === "contextual"}
                />
                <SectionTag
                  value={`Ambiguous ${referenceFilterCounts.ambiguous}`}
                  tone="amber"
                  onClick={() => setReferenceFilterMode("ambiguous")}
                  active={referenceFilterMode === "ambiguous"}
                />
                <SectionTag
                  value={`Incidental ${referenceFilterCounts.incidental}`}
                  tone="slate"
                  onClick={() => setReferenceFilterMode("incidental")}
                  active={referenceFilterMode === "incidental"}
                />
              </div>
            </div>

            {filteredReferences.length > 0 ? (
              <div className="space-y-3">
                {filteredReferences.map((entry) => (
                  <ReferenceEntry
                    key={entry.reference.id}
                    entry={entry}
                    selectedLocationName={dossier.location?.display_name}
                    activeFilterMode={referenceFilterMode}
                    onSelectFilter={setReferenceFilterMode}
                  />
                ))}
              </div>
            ) : (
              <div className="text-sm text-slate-500">
                No references match the current filter.
              </div>
            )}
          </InspectorSection>

          <InspectorSection
            title="Spatial Claims"
            subtitle="Claims involving this location from the structured geography layer"
            defaultOpen
          >
            {dossier.claims.length > 0 ? (
              <div className="space-y-3">
                {dossier.claims.map((claim) => (
                  <div
                    key={claim.claim_id}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-3"
                  >
                    <div className="flex flex-wrap gap-2">
                      <SectionTag value={getClaimPerspectiveLabel(claim, selectedObject.sourceId)} tone="blue" />
                      <SectionTag value={claim.claim_basis} tone="amber" />
                      <SectionTag value={`${claim.confidence} confidence`} tone="green" />
                    </div>
                    <div className="mt-2 text-sm font-medium text-slate-900">
                      {getClaimPerspectiveLabel(claim, selectedObject.sourceId)}{" "}
                      {getOtherLocationLabel(claim, selectedObject.sourceId, dossier)}
                    </div>
                    <div className="mt-1 text-xs text-slate-500">
                      Reference {claim.reference_id}
                    </div>
                    <div className="mt-2 text-sm leading-6 text-slate-700">
                      {claim.source_phrase}
                    </div>
                    {claim.notes ? (
                      <div className="mt-2 text-xs leading-5 text-slate-500">{claim.notes}</div>
                    ) : null}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-slate-500">No spatial claims found.</div>
            )}
          </InspectorSection>

          <InspectorSection
            title="Placement Considerations"
            subtitle="Keep text-driven evidence primary and label inference separately"
            defaultOpen={
              selectedObject.metadata?.visibilityTier === "tier_3_supporting" ||
              selectedObject.metadata?.visibilityTier === "tier_4_detail"
            }
          >
            <div className="space-y-4">
              <ConsiderationList
                title="Text-driven"
                items={dossier.placementConsiderations.textDriven}
              />
              <ConsiderationList
                title="Inference-driven"
                items={dossier.placementConsiderations.inferenceDriven}
              />
              <ConsiderationList
                title="Readability-driven"
                items={dossier.placementConsiderations.readabilityDriven}
              />
              <ConsiderationList
                title="Open questions"
                items={dossier.placementConsiderations.openQuestions}
              />
            </div>
          </InspectorSection>

          <InspectorSection
            title="Events / Movement"
            subtitle="Related events and event steps for corridor context"
          >
            {dossier.events.length > 0 ? (
              <div className="space-y-3">
                {dossier.events.map((event) => {
                  const relatedSteps = dossier.eventSteps.filter(
                    (step) => step.event_id === event.event_id
                  );

                  return (
                    <div
                      key={event.event_id}
                      className="rounded-2xl border border-slate-200 bg-slate-50 p-3"
                    >
                      <div className="text-sm font-semibold text-slate-900">
                        {event.event_name}
                      </div>
                      <div className="mt-1 text-xs text-slate-500">
                        {humanizeToken(event.event_type)} • {event.time_scope.book}{" "}
                        {event.time_scope.chapter_start}
                        {event.time_scope.chapter_start !== event.time_scope.chapter_end
                          ? `-${event.time_scope.chapter_end}`
                          : ""}
                      </div>
                      <div className="mt-2 text-sm leading-6 text-slate-700">
                        {event.summary}
                      </div>
                      {relatedSteps.length > 0 ? (
                        <div className="mt-3 space-y-2">
                          {relatedSteps.map((step) => (
                            <div
                              key={step.event_step_id}
                              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
                            >
                              <div className="font-medium text-slate-900">
                                {humanizeToken(step.step_type)} with{" "}
                                {getMovementStepLabel(step, selectedObject.sourceId, dossier)}
                              </div>
                              <div className="mt-1 text-xs text-slate-500">
                                Reference {step.reference_id} • {step.path_certainty} certainty
                              </div>
                              {step.notes ? (
                                <div className="mt-1 text-xs leading-5 text-slate-500">
                                  {step.notes}
                                </div>
                              ) : null}
                            </div>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-sm text-slate-500">No related event steps found.</div>
            )}
          </InspectorSection>

          <InspectorSection
            title="Related Locations"
            subtitle="Useful attachment-family jump points from claims and linked entities"
          >
            {dossier.relatedLocations.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {dossier.relatedLocations.map((location) => (
                  <span
                    key={location.id}
                    className="rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700"
                  >
                    {location.display_name}
                  </span>
                ))}
              </div>
            ) : (
              <div className="text-sm text-slate-500">No related locations listed.</div>
            )}
          </InspectorSection>
        </div>
      ) : isEvidenceLoading ? (
        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500 shadow-sm">
          Loading evidence dossier...
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500 shadow-sm">
          Evidence dossier unavailable for this selection.
        </div>
      )}
    </aside>
  );
}
