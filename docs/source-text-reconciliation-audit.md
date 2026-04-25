# Source Text Reconciliation Audit

This report compares the raw verse corpus in `data/bom_text/` against the current extracted geography layer.

## Method
- Scan actionable locations only: source locations and derived overlays, excluding analytical constructs.
- Match only stronger location phrases first, using multi-word variants and a short list of distinctive single-word names.
- Compare each verse hit against current extracted coverage from both `references.json` and `location_mentions.json`.
- Treat uncovered hits as likely candidates for review, not automatic proof of missing extraction.

## Summary
- Total verses scanned: 6124
- Actionable locations scanned: 119
- Locations with strong phrase patterns: 119
- Actionable locations with no strong phrase pattern for this audit: 0
- Total strong phrase hits in source text: 586
- Covered strong phrase hits: 586
- Likely uncovered strong phrase hits: 0
- Locations with at least one likely uncovered candidate: 0
- Source locations with likely uncovered candidates: 0
- Derived overlays with likely uncovered candidates: 0

## Notes
- This is a conservative reconciliation pass. It intentionally avoids relying heavily on ambiguous single-word names like `Nephi` or `Zarahemla` when those could refer to people as well as places.
- A verse appearing here does not automatically mean the extraction is wrong; some hits may still be false positives or may already be represented indirectly in broader verse spans.
- This report is best used as a review queue for improving extraction confidence before map refinement.

## Top Review Queue: Source Locations
- none

## Secondary Review Queue: Derived Overlays
- none

## Locations With No Strong Phrase Pattern In This Audit
- none

## Global Candidate Sample
- none
