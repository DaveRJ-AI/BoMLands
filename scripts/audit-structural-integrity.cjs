const fs = require("fs");

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function uniqueSorted(values) {
  return [...new Set(values)].sort((a, b) => String(a).localeCompare(String(b)));
}

function formatList(items, empty = "- none\n") {
  if (!items.length) return empty;
  return items.map((item) => `- ${item}\n`).join("");
}

function toCountsById(items) {
  const counts = new Map();
  for (const item of items) {
    counts.set(item, (counts.get(item) ?? 0) + 1);
  }
  return counts;
}

const locations = readJson("data/core/locations.json").locations;
const references = readJson("data/core/references.json").references;
const locationMentions = readJson("data/core/location_mentions.json").location_mentions;
const claims = readJson("data/core/spatial_claims.json").spatial_claims;
const events = readJson("data/core/events.json").events;
const eventSteps = readJson("data/core/event_steps.json").event_steps;

const locationIds = new Set(locations.map((location) => location.id));
const referenceIds = new Set(references.map((reference) => reference.id));
const eventIds = new Set(events.map((event) => event.event_id));

const missingLocationIdsFromReferenceArrays = uniqueSorted(
  references
    .flatMap((reference) => reference.location_mentions ?? [])
    .filter((locationId) => !locationIds.has(locationId))
);

const missingLocationIdsFromMentions = uniqueSorted(
  locationMentions
    .map((mention) => mention.location_id)
    .filter((locationId) => !locationIds.has(locationId))
);

const missingReferenceIdsFromMentions = uniqueSorted(
  locationMentions
    .map((mention) => mention.reference_id)
    .filter((referenceId) => !referenceIds.has(referenceId))
);

const missingClaimSubjectIds = uniqueSorted(
  claims
    .map((claim) => claim.subject_location_id)
    .filter((locationId) => !locationIds.has(locationId))
);

const missingClaimObjectIds = uniqueSorted(
  claims
    .map((claim) => claim.object_location_id)
    .filter((locationId) => !locationIds.has(locationId))
);

const missingClaimReferenceIds = uniqueSorted(
  claims
    .map((claim) => claim.reference_id)
    .filter((referenceId) => !referenceIds.has(referenceId))
);

const missingEventRelatedReferenceIds = uniqueSorted(
  events
    .flatMap((event) => event.related_references ?? [])
    .filter((referenceId) => !referenceIds.has(referenceId))
);

const missingEventStepEventIds = uniqueSorted(
  eventSteps
    .map((step) => step.event_id)
    .filter((eventId) => !eventIds.has(eventId))
);

const missingEventStepReferenceIds = uniqueSorted(
  eventSteps
    .map((step) => step.reference_id)
    .filter((referenceId) => !referenceIds.has(referenceId))
);

const missingEventStepFromLocationIds = uniqueSorted(
  eventSteps
    .map((step) => step.from_location_id)
    .filter((locationId) => !locationIds.has(locationId))
);

const missingEventStepToLocationIds = uniqueSorted(
  eventSteps
    .map((step) => step.to_location_id)
    .filter((locationId) => !locationIds.has(locationId))
);

const missingLinkedEntityIds = uniqueSorted(
  locations
    .flatMap((location) => location.linked_entities ?? [])
    .filter((locationId) => !locationIds.has(locationId))
);

const mentionLocationIds = new Set(locationMentions.map((mention) => mention.location_id));
const referenceArrayLocationIds = new Set(
  references.flatMap((reference) => reference.location_mentions ?? [])
);
const claimLocationIds = new Set(
  claims.flatMap((claim) => [claim.subject_location_id, claim.object_location_id])
);
const eventStepLocationIds = new Set(
  eventSteps.flatMap((step) => [step.from_location_id, step.to_location_id])
);

const allExternallyReferencedLocationIds = new Set([
  ...referenceArrayLocationIds,
  ...mentionLocationIds,
  ...claimLocationIds,
  ...eventStepLocationIds
]);

const referencedButMissingLocations = uniqueSorted(
  [...allExternallyReferencedLocationIds].filter((locationId) => !locationIds.has(locationId))
);

const referenceArrayCounts = toCountsById(
  references.flatMap((reference) => reference.location_mentions ?? [])
);
const mentionCounts = toCountsById(locationMentions.map((mention) => mention.location_id));
const claimCounts = toCountsById(
  claims.flatMap((claim) => [claim.subject_location_id, claim.object_location_id])
);
const eventStepCounts = toCountsById(
  eventSteps.flatMap((step) => [step.from_location_id, step.to_location_id])
);

const structurallyUnusedLocations = locations
  .filter((location) => {
    const id = location.id;
    return (
      !referenceArrayCounts.has(id) &&
      !mentionCounts.has(id) &&
      !claimCounts.has(id) &&
      !eventStepCounts.has(id)
    );
  })
  .map((location) => `${location.display_name} (\`${location.id}\`)`);

const referenceArrayWithoutMentionRows = uniqueSorted(
  [...referenceArrayLocationIds].filter((locationId) => !mentionLocationIds.has(locationId))
);

const mentionRowsWithoutReferenceArrayUse = uniqueSorted(
  [...mentionLocationIds].filter((locationId) => !referenceArrayLocationIds.has(locationId))
);

const summary = {
  totalLocations: locations.length,
  totalReferences: references.length,
  totalMentions: locationMentions.length,
  totalClaims: claims.length,
  totalEvents: events.length,
  totalEventSteps: eventSteps.length,
  referencedButMissingLocations: referencedButMissingLocations.length,
  structurallyUnusedLocations: structurallyUnusedLocations.length,
  missingReferenceIdsFromMentions: missingReferenceIdsFromMentions.length,
  missingClaimReferenceIds: missingClaimReferenceIds.length,
  missingEventStepReferenceIds: missingEventStepReferenceIds.length,
  missingEventRelatedReferenceIds: missingEventRelatedReferenceIds.length
};

const report = `# Structural Integrity Audit

Generated from the current core data files to check cross-file location/reference wiring.

## Summary
- Total locations: ${summary.totalLocations}
- Total references: ${summary.totalReferences}
- Total location mentions: ${summary.totalMentions}
- Total spatial claims: ${summary.totalClaims}
- Total events: ${summary.totalEvents}
- Total event steps: ${summary.totalEventSteps}
- Referenced location ids missing from \`locations.json\`: ${summary.referencedButMissingLocations}
- Structurally unused location records: ${summary.structurallyUnusedLocations}
- Mention rows with missing reference ids: ${summary.missingReferenceIdsFromMentions}
- Claims with missing reference ids: ${summary.missingClaimReferenceIds}
- Event steps with missing reference ids: ${summary.missingEventStepReferenceIds}
- Events with missing related reference ids: ${summary.missingEventRelatedReferenceIds}

## Notes
- This audit is about structural consistency across the extracted core files.
- It is complementary to the source-text reconciliation audit.
- A location can still be “weak” or “under-described” while passing this audit; the goal here is to catch dangling ids and half-modeled entities.

## Referenced Location Ids Missing From locations.json
${formatList(referencedButMissingLocations)}

## Reference.location_mentions Ids Missing From locations.json
${formatList(missingLocationIdsFromReferenceArrays)}

## location_mentions.location_id Values Missing From locations.json
${formatList(missingLocationIdsFromMentions)}

## spatial_claims.subject_location_id Values Missing From locations.json
${formatList(missingClaimSubjectIds)}

## spatial_claims.object_location_id Values Missing From locations.json
${formatList(missingClaimObjectIds)}

## event_steps.from_location_id Values Missing From locations.json
${formatList(missingEventStepFromLocationIds)}

## event_steps.to_location_id Values Missing From locations.json
${formatList(missingEventStepToLocationIds)}

## location_mentions.reference_id Values Missing From references.json
${formatList(missingReferenceIdsFromMentions)}

## spatial_claims.reference_id Values Missing From references.json
${formatList(missingClaimReferenceIds)}

## events.related_references Values Missing From references.json
${formatList(missingEventRelatedReferenceIds)}

## event_steps.reference_id Values Missing From references.json
${formatList(missingEventStepReferenceIds)}

## event_steps.event_id Values Missing From events.json
${formatList(missingEventStepEventIds)}

## locations.linked_entities Values Missing From locations.json
${formatList(missingLinkedEntityIds)}

## Location Ids Present In reference.location_mentions But Missing mention Rows
${formatList(referenceArrayWithoutMentionRows)}

## Location Ids Present In mention Rows But Missing From reference.location_mentions Arrays
${formatList(mentionRowsWithoutReferenceArrayUse)}

## Structurally Unused Location Records
${formatList(structurallyUnusedLocations)}
`;

fs.writeFileSync("docs/structural-integrity-audit.md", report, "utf8");
console.log("Wrote docs/structural-integrity-audit.md");
