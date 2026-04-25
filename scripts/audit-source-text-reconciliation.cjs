const fs = require("fs");
const path = require("path");

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function deriveNodeKind(location) {
  if (location.node_kind) {
    return location.node_kind;
  }

  if (location.named_status === "abstract") {
    return "analytical_construct";
  }

  if (
    location.map_role === "macro_region" &&
    location.certainty_level === "normalized" &&
    /abstract|aggregate|overlay/i.test(
      `${location.notes ?? ""} ${location.classification_rationale ?? ""}`
    )
  ) {
    return "analytical_construct";
  }

  if (
    location.named_status === "unnamed" ||
    location.named_status === "mixed" ||
    location.certainty_level === "normalized" ||
    location.certainty_level === "inferred"
  ) {
    return "derived_overlay";
  }

  return "source_location";
}

function parseBomVerses() {
  const versesDir = path.join(process.cwd(), "data/bom_text");
  const verseFiles = fs
    .readdirSync(versesDir)
    .filter((fileName) => fileName.endsWith("-verses.ts"))
    .sort();

  const verses = [];
  const versePattern =
    /id: "([^"]+)",\s*book: "([^"]+)",\s*chapter: (\d+),\s*verse: (\d+),\s*text: "([^"]*(?:\\.[^"]*)*)"/g;

  for (const fileName of verseFiles) {
    const fileText = fs.readFileSync(path.join(versesDir, fileName), "utf8");
    for (const match of fileText.matchAll(versePattern)) {
      verses.push({
        id: match[1],
        book: match[2],
        chapter: Number(match[3]),
        verse: Number(match[4]),
        text: match[5].replace(/\\"/g, '"')
      });
    }
  }

  return verses;
}

function getVerseKey(book, chapter, verse) {
  return `${book}|${chapter}|${verse}`;
}

function getReferenceSpanKeys(reference) {
  const keys = [];
  for (let verse = reference.verse_start; verse <= reference.verse_end; verse += 1) {
    keys.push(getVerseKey(reference.book, reference.chapter, verse));
  }
  return keys;
}

function hasStrongPhraseShape(location, variant) {
  const normalized = variant.trim().toLowerCase();
  if (!normalized) {
    return false;
  }

  const noisyGenericVariants = new Set([
    "wilderness",
    "mountain",
    "the mount",
    "seashore",
    "tower",
    "many waters",
    "promised land",
    "land of promise",
    "sea crossing"
  ]);

  if (noisyGenericVariants.has(normalized)) {
    return false;
  }

  if (normalized.split(/\s+/).length >= 2) {
    return true;
  }

  const featureWords = [
    "land",
    "city",
    "sea",
    "river",
    "hill",
    "valley",
    "mount",
    "wilderness",
    "temple",
    "waters",
    "place",
    "house",
    "tower",
    "route",
    "pass",
    "neck",
    "coast"
  ];

  if (featureWords.some((word) => normalized.includes(word))) {
    return true;
  }

  const distinctiveSingles = new Set([
    "hermounts",
    "nahom",
    "cumorah",
    "ramah",
    "sidon",
    "sebus",
    "moriancumer"
  ]);

  if (distinctiveSingles.has(normalized) && location.named_status === "named") {
    return true;
  }

  return false;
}

function isChronologyOnlySplitNode(location) {
  return (
    location.default_render_state === "chronology_only" &&
    Array.isArray(location.chronology?.periods) &&
    location.chronology.periods.length === 1
  );
}

function getAuditVariants(location, locations) {
  const rawVariants = [
    ...(Array.isArray(location.variant_forms) ? location.variant_forms : []),
    location.canonical_name
  ]
    .filter(Boolean)
    .map((value) => value.trim())
    .filter(Boolean);

  const uniqueVariants = [...new Set(rawVariants)];

  if (!isChronologyOnlySplitNode(location) || !location.merge_group) {
    return uniqueVariants;
  }

  const siblingLocations = locations.filter(
    (candidate) =>
      candidate.id !== location.id &&
      candidate.merge_group === location.merge_group &&
      candidate.feature_type === location.feature_type
  );

  const siblingVariantSet = new Set(
    siblingLocations.flatMap((candidate) =>
      [
        ...(Array.isArray(candidate.variant_forms) ? candidate.variant_forms : []),
        candidate.canonical_name
      ]
        .filter(Boolean)
        .map((value) => value.trim().toLowerCase())
    )
  );

  return uniqueVariants.filter((variant) => {
    const normalized = variant.toLowerCase();
    const hasPeriodQualifier = /\(|post-christ|destruction|rebuilt|again/i.test(variant);
    if (hasPeriodQualifier) {
      return true;
    }

    return !siblingVariantSet.has(normalized);
  });
}

function shouldAuditVerseForLocation(location, verse) {
  switch (location.id) {
    case "city_jerusalem":
      return verse.book === "Alma" || verse.book === "3 Nephi";
    case "jerusalem_old_world":
      return verse.book === "1 Nephi" || verse.book === "2 Nephi";
    case "city_moroni":
      return verse.book === "Alma";
    case "city_moroni_destruction":
      return verse.book === "3 Nephi";
    case "land_bountiful":
      return verse.book !== "1 Nephi";
    case "bountiful_old_world":
      return verse.book === "1 Nephi";
    case "land_first_inheritance":
      return verse.book !== "Ether";
    default:
      return true;
  }
}

function buildLocationPatterns(locations) {
  return locations
    .map((location) => {
      const strongVariants = getAuditVariants(location, locations)
        .filter((variant) => hasStrongPhraseShape(location, variant))
        .sort((a, b) => b.length - a.length);

      return {
        location,
        strongVariants,
        regexes: strongVariants.map((variant) => ({
          variant,
          regex: new RegExp(`(^|[^A-Za-z])(${escapeRegex(variant)})(?=[^A-Za-z-]|$)`, "i")
        }))
      };
    })
    .filter((entry) => entry.strongVariants.length > 0);
}

const locations = readJson("data/core/locations.json").locations;
const references = readJson("data/core/references.json").references;
const mentions = readJson("data/core/location_mentions.json").location_mentions;
const verses = parseBomVerses();

const actionableLocations = locations.filter(
  (location) => deriveNodeKind(location) !== "analytical_construct"
);
const locationPatterns = buildLocationPatterns(actionableLocations);
const referenceMap = new Map(references.map((reference) => [reference.id, reference]));

const coveredVerseKeysByLocation = new Map();
for (const location of actionableLocations) {
  coveredVerseKeysByLocation.set(location.id, new Set());
}

for (const reference of references) {
  const spanKeys = getReferenceSpanKeys(reference);
  for (const locationId of reference.location_mentions || []) {
    if (!coveredVerseKeysByLocation.has(locationId)) {
      continue;
    }
    const targetSet = coveredVerseKeysByLocation.get(locationId);
    for (const key of spanKeys) {
      targetSet.add(key);
    }
  }
}

for (const mention of mentions) {
  if (!coveredVerseKeysByLocation.has(mention.location_id)) {
    continue;
  }

  const reference = referenceMap.get(mention.reference_id);
  if (!reference) {
    continue;
  }

  const targetSet = coveredVerseKeysByLocation.get(mention.location_id);
  for (const key of getReferenceSpanKeys(reference)) {
    targetSet.add(key);
  }
}

const mergeGroupBuckets = new Map();
for (const location of actionableLocations) {
  if (!location.merge_group) {
    continue;
  }

  const bucketKey = `${location.merge_group}::${location.feature_type}`;
  if (!mergeGroupBuckets.has(bucketKey)) {
    mergeGroupBuckets.set(bucketKey, []);
  }
  mergeGroupBuckets.get(bucketKey).push(location.id);
}

for (const locationIds of mergeGroupBuckets.values()) {
  const mergedCoverage = new Set();
  for (const locationId of locationIds) {
    const targetSet = coveredVerseKeysByLocation.get(locationId);
    if (!targetSet) {
      continue;
    }
    for (const key of targetSet) {
      mergedCoverage.add(key);
    }
  }

  for (const locationId of locationIds) {
    const targetSet = coveredVerseKeysByLocation.get(locationId);
    if (!targetSet) {
      continue;
    }
    for (const key of mergedCoverage) {
      targetSet.add(key);
    }
  }
}

const perLocation = new Map(
  locationPatterns.map((entry) => [
    entry.location.id,
    {
      location: entry.location,
      strongVariants: entry.strongVariants,
      totalStrongPhraseHits: 0,
      coveredStrongPhraseHits: 0,
      uncoveredCandidates: []
    }
  ])
);

const globalUncovered = [];

for (const verse of verses) {
  const verseKey = getVerseKey(verse.book, verse.chapter, verse.verse);

  for (const entry of locationPatterns) {
    if (!shouldAuditVerseForLocation(entry.location, verse)) {
      continue;
    }

    const match = entry.regexes.find(({ regex }) => regex.test(verse.text));
    if (!match) {
      continue;
    }

    const bucket = perLocation.get(entry.location.id);
    bucket.totalStrongPhraseHits += 1;

    const isCovered = coveredVerseKeysByLocation.get(entry.location.id)?.has(verseKey);
    if (isCovered) {
      bucket.coveredStrongPhraseHits += 1;
      continue;
    }

    const candidate = {
      book: verse.book,
      chapter: verse.chapter,
      verse: verse.verse,
      verseId: verse.id,
      matchedVariant: match.variant,
      text: verse.text
    };

    bucket.uncoveredCandidates.push(candidate);
    globalUncovered.push({
      locationId: entry.location.id,
      displayName: entry.location.display_name,
      nodeKind: deriveNodeKind(entry.location),
      matchedVariant: match.variant,
      ...candidate
    });
  }
}

const locationsWithCandidates = [...perLocation.values()]
  .filter((entry) => entry.uncoveredCandidates.length > 0)
  .sort((a, b) => {
    return (
      (deriveNodeKind(a.location) === "source_location" ? 0 : 1) -
        (deriveNodeKind(b.location) === "source_location" ? 0 : 1) ||
      b.uncoveredCandidates.length - a.uncoveredCandidates.length ||
      a.location.display_name.localeCompare(b.location.display_name)
    );
  });

const sourceLocationCandidates = locationsWithCandidates.filter(
  (entry) => deriveNodeKind(entry.location) === "source_location"
);
const derivedOverlayCandidates = locationsWithCandidates.filter(
  (entry) => deriveNodeKind(entry.location) === "derived_overlay"
);

const locationsWithoutStrongPatterns = actionableLocations
  .filter((location) => !locationPatterns.some((entry) => entry.location.id === location.id))
  .sort((a, b) => a.display_name.localeCompare(b.display_name));

function formatVerseRef(candidate) {
  return `${candidate.book} ${candidate.chapter}:${candidate.verse}`;
}

function locationSection(entry) {
  const examples = entry.uncoveredCandidates
    .slice(0, 6)
    .map(
      (candidate) =>
        `- ${formatVerseRef(candidate)} | matched: "${candidate.matchedVariant}" | ${candidate.text}`
    )
    .join("\n");

  return `### ${entry.location.display_name} (\`${entry.location.id}\`)
- Node kind: ${deriveNodeKind(entry.location)}
- Strong phrase variants used: ${entry.strongVariants.join("; ")}
- Strong phrase hits in source text: ${entry.totalStrongPhraseHits}
- Already covered by extracted refs: ${entry.coveredStrongPhraseHits}
- Likely uncovered candidates: ${entry.uncoveredCandidates.length}
${examples || "- none"}
`;
}

const report = `# Source Text Reconciliation Audit

This report compares the raw verse corpus in \`data/bom_text/\` against the current extracted geography layer.

## Method
- Scan actionable locations only: source locations and derived overlays, excluding analytical constructs.
- Match only stronger location phrases first, using multi-word variants and a short list of distinctive single-word names.
- Compare each verse hit against current extracted coverage from both \`references.json\` and \`location_mentions.json\`.
- Treat uncovered hits as likely candidates for review, not automatic proof of missing extraction.

## Summary
- Total verses scanned: ${verses.length}
- Actionable locations scanned: ${actionableLocations.length}
- Locations with strong phrase patterns: ${locationPatterns.length}
- Actionable locations with no strong phrase pattern for this audit: ${locationsWithoutStrongPatterns.length}
- Total strong phrase hits in source text: ${[...perLocation.values()].reduce((sum, entry) => sum + entry.totalStrongPhraseHits, 0)}
- Covered strong phrase hits: ${[...perLocation.values()].reduce((sum, entry) => sum + entry.coveredStrongPhraseHits, 0)}
- Likely uncovered strong phrase hits: ${globalUncovered.length}
- Locations with at least one likely uncovered candidate: ${locationsWithCandidates.length}
- Source locations with likely uncovered candidates: ${sourceLocationCandidates.length}
- Derived overlays with likely uncovered candidates: ${derivedOverlayCandidates.length}

## Notes
- This is a conservative reconciliation pass. It intentionally avoids relying heavily on ambiguous single-word names like \`Nephi\` or \`Zarahemla\` when those could refer to people as well as places.
- A verse appearing here does not automatically mean the extraction is wrong; some hits may still be false positives or may already be represented indirectly in broader verse spans.
- This report is best used as a review queue for improving extraction confidence before map refinement.

## Top Review Queue: Source Locations
${sourceLocationCandidates.slice(0, 15).map(locationSection).join("\n") || "- none"}

## Secondary Review Queue: Derived Overlays
${derivedOverlayCandidates.slice(0, 12).map(locationSection).join("\n") || "- none"}

## Locations With No Strong Phrase Pattern In This Audit
${locationsWithoutStrongPatterns.length > 0
  ? locationsWithoutStrongPatterns
      .map(
        (location) =>
          `- ${location.display_name} (\`${location.id}\`) | variants: ${(location.variant_forms || []).join("; ")}`
      )
      .join("\n")
  : "- none"}

## Global Candidate Sample
${globalUncovered
  .slice(0, 40)
  .map(
    (candidate) =>
      `- ${candidate.displayName} (\`${candidate.locationId}\`) | ${formatVerseRef(candidate)} | matched: "${candidate.matchedVariant}"`
  )
  .join("\n") || "- none"}
`;

fs.writeFileSync("docs/source-text-reconciliation-audit.md", report, "utf8");
console.log("Wrote docs/source-text-reconciliation-audit.md");
