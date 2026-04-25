# Core Data Coverage Audit

Generated from current core data files after structural normalization.

## Summary
- Total locations: 117
- Visible locations: 114
- Visible source locations: 79
- Visible derived overlays: 31
- Visible analytical constructs: 4
- Locations with zero references: 2
- Visible locations with zero references: 2
- Locations with zero claims: 2
- Visible locations with zero claims: 2
- Location ids present in `references.json` but absent from `location_mentions.json`: 0

## Notes
- Structural corruption in several core files was repaired before this audit.
- Counts below reflect the repaired data now used by the app.
- 'node_kind' and 'evidence_status' help distinguish source-grounded locations from derived overlays and analytical constructs.
- Zero-reference results can mean one of three things:
  1. true missing extraction
  2. city/land split not yet linked at the mention layer
  3. intentional aggregate/abstract node with event context but no direct reference row

## Visible Analytical Constructs
- Jaredite Desolation Region (`jaredite_region_desolation`) | kind: analytical_construct | evidence: analytical_abstract | tier: tier_3_supporting | refs: 1 | claims: 1 | first ref: Alma 22:30
- Lamanite Regions (`lamanite_regions_general`) | kind: analytical_construct | evidence: analytical_abstract | tier: tier_4_detail | refs: 0 | claims: 0 | first ref: Alma 17:8
- Mission Field (Aggregate) (`multiple_lamanite_lands`) | kind: analytical_construct | evidence: analytical_abstract | tier: tier_4_detail | refs: 0 | claims: 0 | first ref: Alma 26:1
- Mulekite Zarahemla Region (`mulekite_zarahemla_region`) | kind: analytical_construct | evidence: analytical_abstract | tier: tier_4_detail | refs: 2 | claims: 1 | first ref: Omni 1:14


## Visible Source / Derived Locations With Zero References
- none


## Visible Source / Derived Locations With Zero Claims
- none


## Visible Locations With Zero References
- Lamanite Regions (`lamanite_regions_general`) | kind: analytical_construct | evidence: analytical_abstract | tier: tier_4_detail | refs: 0 | claims: 0 | first ref: Alma 17:8
- Mission Field (Aggregate) (`multiple_lamanite_lands`) | kind: analytical_construct | evidence: analytical_abstract | tier: tier_4_detail | refs: 0 | claims: 0 | first ref: Alma 26:1


## Visible Locations With Zero Claims
- Lamanite Regions (`lamanite_regions_general`) | kind: analytical_construct | evidence: analytical_abstract | tier: tier_4_detail | refs: 0 | claims: 0 | first ref: Alma 17:8
- Mission Field (Aggregate) (`multiple_lamanite_lands`) | kind: analytical_construct | evidence: analytical_abstract | tier: tier_4_detail | refs: 0 | claims: 0 | first ref: Alma 26:1


## Tier 1 Anchors With One Or Fewer References
- Sea South (`sea_south`) | kind: source_location | evidence: source_grounded | tier: tier_1_anchor | refs: 1 | claims: 1 | first ref: Helaman 3:8
- Sea North (`sea_north`) | kind: source_location | evidence: source_grounded | tier: tier_1_anchor | refs: 1 | claims: 1 | first ref: Helaman 3:8
- Ramah / Cumorah (`hill_ramah_cumorah`) | kind: derived_overlay | evidence: inference_supported | tier: tier_1_anchor | refs: 1 | claims: 2 | first ref: Ether 15:11
- Nahom (`place_nahom_old_world`) | kind: source_location | evidence: source_grounded | tier: tier_1_anchor | refs: 1 | claims: 3 | first ref: 1 Nephi 16:34


## Tier 3 / Tier 4 Locations With Zero References
- Lamanite Regions (`lamanite_regions_general`) | kind: analytical_construct | evidence: analytical_abstract | tier: tier_4_detail | refs: 0 | claims: 0 | first ref: Alma 17:8
- Mission Field (Aggregate) (`multiple_lamanite_lands`) | kind: analytical_construct | evidence: analytical_abstract | tier: tier_4_detail | refs: 0 | claims: 0 | first ref: Alma 26:1


## Priority New World Gaps
- none


