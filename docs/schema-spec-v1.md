# Schema Spec v1

## Core Files

- locations.json
- references.json
- location_mentions.json
- spatial_terms.json
- spatial_claims.json
- events.json
- event_steps.json

## Design Philosophy

- Separate extraction from interpretation
- Preserve ambiguity
- Use toggle groups for interpretive control

## Key Rule

UP/DOWN are NOT directions by default.
They are:
- stored as spatial terms
- interpreted later via toggles