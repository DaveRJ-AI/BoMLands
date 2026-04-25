# Structural Integrity Audit

Generated from the current core data files to check cross-file location/reference wiring.

## Summary
- Total locations: 166
- Total references: 517
- Total location mentions: 886
- Total spatial claims: 202
- Total events: 12
- Total event steps: 59
- Referenced location ids missing from `locations.json`: 0
- Structurally unused location records: 1
- Mention rows with missing reference ids: 0
- Claims with missing reference ids: 0
- Event steps with missing reference ids: 0
- Events with missing related reference ids: 0

## Notes
- This audit is about structural consistency across the extracted core files.
- It is complementary to the source-text reconciliation audit.
- A location can still be “weak” or “under-described” while passing this audit; the goal here is to catch dangling ids and half-modeled entities.

## Referenced Location Ids Missing From locations.json
- none


## Reference.location_mentions Ids Missing From locations.json
- none


## location_mentions.location_id Values Missing From locations.json
- none


## spatial_claims.subject_location_id Values Missing From locations.json
- none


## spatial_claims.object_location_id Values Missing From locations.json
- none


## event_steps.from_location_id Values Missing From locations.json
- none


## event_steps.to_location_id Values Missing From locations.json
- none


## location_mentions.reference_id Values Missing From references.json
- none


## spatial_claims.reference_id Values Missing From references.json
- none


## events.related_references Values Missing From references.json
- none


## event_steps.reference_id Values Missing From references.json
- none


## event_steps.event_id Values Missing From events.json
- none


## locations.linked_entities Values Missing From locations.json
- none


## Location Ids Present In reference.location_mentions But Missing mention Rows
- none


## Location Ids Present In mention Rows But Missing From reference.location_mentions Arrays
- none


## Structurally Unused Location Records
- Mission Field (Aggregate) (`multiple_lamanite_lands`)

