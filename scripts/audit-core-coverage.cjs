const fs = require("fs");

function readJson(path) {
  return JSON.parse(fs.readFileSync(path, "utf8"));
}

const locations = readJson("data/core/locations.json").locations;
const references = readJson("data/core/references.json").references;
const mentions = readJson("data/core/location_mentions.json").location_mentions;
const claims = readJson("data/core/spatial_claims.json").spatial_claims;
const eventSteps = readJson("data/core/event_steps.json").event_steps;

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

function deriveEvidenceStatus(location, referencesCount, claimsCount) {
  if (location.evidence_status) {
    return location.evidence_status;
  }

  const nodeKind = deriveNodeKind(location);
  if (nodeKind === "analytical_construct") {
    return "analytical_abstract";
  }

  if (referencesCount === 0 || claimsCount === 0) {
    return "coverage_review_needed";
  }

  if (
    nodeKind === "derived_overlay" ||
    location.certainty_level === "normalized" ||
    location.certainty_level === "inferred" ||
    location.certainty_level === "provisional"
  ) {
    return "inference_supported";
  }

  return "source_grounded";
}

function buildRow(location) {
  const locationMentions = mentions.filter((mention) => mention.location_id === location.id);
  const referenceIds = [...new Set(locationMentions.map((mention) => mention.reference_id))];
  const locationClaims = claims.filter(
    (claim) =>
      claim.subject_location_id === location.id || claim.object_location_id === location.id
  );
  const locationEventSteps = eventSteps.filter(
    (step) =>
      step.from_location_id === location.id || step.to_location_id === location.id
  );

  return {
    id: location.id,
    name: location.display_name,
    tier: location.visibility_tier,
    feature: location.feature_type,
    domain: location.render_domain,
    defaultState: location.default_render_state,
    certainty: location.certainty_level,
    nodeKind: deriveNodeKind(location),
    evidenceStatus: deriveEvidenceStatus(location, referenceIds.length, locationClaims.length),
    firstReference: location.first_reference,
    linkedEntities: location.linked_entities,
    references: referenceIds.length,
    mentions: locationMentions.length,
    explicitMentions: locationMentions.filter((mention) => mention.is_explicit).length,
    claims: locationClaims.length,
    explicitClaims: locationClaims.filter((claim) => claim.claim_basis === "explicit").length,
    eventSteps: locationEventSteps.length
  };
}

const rows = locations.map(buildRow);
const visibleRows = rows.filter((row) => row.defaultState !== "hidden");
const newWorldRows = rows.filter((row) => row.domain === "new_world_map");

function section(title, items) {
  let text = `## ${title}\n`;
  if (items.length === 0) {
    return `${text}- none\n\n`;
  }

  for (const item of items) {
    text += `- ${item.name} (\`${item.id}\`) | kind: ${item.nodeKind} | evidence: ${item.evidenceStatus} | tier: ${item.tier} | refs: ${item.references} | claims: ${item.claims} | first ref: ${item.firstReference}\n`;
  }

  return `${text}\n`;
}

const zeroRefVisible = visibleRows.filter((row) => row.references === 0);
const zeroClaimVisible = visibleRows.filter((row) => row.claims === 0);
const analyticalVisible = visibleRows.filter((row) => row.nodeKind === "analytical_construct");
const actionableVisible = visibleRows.filter((row) => row.nodeKind !== "analytical_construct");
const weakTier1 = visibleRows.filter(
  (row) => row.tier === "tier_1_anchor" && row.references <= 1
);
const tier34ZeroRef = visibleRows.filter(
  (row) =>
    (row.tier === "tier_3_supporting" || row.tier === "tier_4_detail") &&
    row.references === 0
);
const newWorldPriorityGaps = newWorldRows
  .filter(
    (row) =>
      row.nodeKind !== "analytical_construct" &&
      (row.references === 0 || row.claims === 0)
  )
  .sort((a, b) => {
    const tierScore = (row) =>
      row.tier === "tier_1_anchor"
        ? 0
        : row.tier === "tier_2_major"
          ? 1
          : row.tier === "tier_3_supporting"
            ? 2
            : 3;

    return (
      tierScore(a) - tierScore(b) ||
      a.references - b.references ||
      a.claims - b.claims ||
      a.name.localeCompare(b.name)
    );
  });

const onlyInReferenceArrays = [
  ...new Set(references.flatMap((reference) => reference.location_mentions || []))
].filter((locationId) => !mentions.some((mention) => mention.location_id === locationId));

const report = `# Core Data Coverage Audit

Generated from current core data files after structural normalization.

## Summary
- Total locations: ${rows.length}
- Visible locations: ${visibleRows.length}
- Visible source locations: ${visibleRows.filter((row) => row.nodeKind === "source_location").length}
- Visible derived overlays: ${visibleRows.filter((row) => row.nodeKind === "derived_overlay").length}
- Visible analytical constructs: ${analyticalVisible.length}
- Locations with zero references: ${rows.filter((row) => row.references === 0).length}
- Visible locations with zero references: ${zeroRefVisible.length}
- Locations with zero claims: ${rows.filter((row) => row.claims === 0).length}
- Visible locations with zero claims: ${zeroClaimVisible.length}
- Location ids present in \`references.json\` but absent from \`location_mentions.json\`: ${onlyInReferenceArrays.length}

## Notes
- Structural corruption in several core files was repaired before this audit.
- Counts below reflect the repaired data now used by the app.
- 'node_kind' and 'evidence_status' help distinguish source-grounded locations from derived overlays and analytical constructs.
- Zero-reference results can mean one of three things:
  1. true missing extraction
  2. city/land split not yet linked at the mention layer
  3. intentional aggregate/abstract node with event context but no direct reference row

${section("Visible Analytical Constructs", analyticalVisible)}
${section("Visible Source / Derived Locations With Zero References", actionableVisible.filter((row) => row.references === 0))}
${section("Visible Source / Derived Locations With Zero Claims", actionableVisible.filter((row) => row.claims === 0))}
${section("Visible Locations With Zero References", zeroRefVisible)}
${section("Visible Locations With Zero Claims", zeroClaimVisible)}
${section("Tier 1 Anchors With One Or Fewer References", weakTier1)}
${section("Tier 3 / Tier 4 Locations With Zero References", tier34ZeroRef)}
${section("Priority New World Gaps", newWorldPriorityGaps)}
`;

fs.writeFileSync("docs/core-data-coverage-audit.md", report, "utf8");
console.log("Wrote docs/core-data-coverage-audit.md");
