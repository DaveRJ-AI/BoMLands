# AI Session Brief — Book of Mormon Geography Project

## Project Purpose
This project is building a **rigorous internal geography workbench** for the Book of Mormon using:
- the **original source text**
- structured **location / mention / reference / spatial claim extractions**
- a relational map interface for reviewing placements before final artwork or underlays

The map is not meant to reflect outside scholarship, traditional geography theories, apologetic models, or modern opinion. It is an **internal-source-only geography system**.

---

## Governing Standard
This project is governed by a strict order of authority:

1. **Original source text first**
2. **Structured extractions second**
3. **Inference only when necessary**
4. **Readability and visual tuning only after the first three**

No outside opinions, external maps, commentaries, scholarly models, or modern geographic theories should be introduced unless explicitly requested later by the user in a separate phase.

### Core rigor rule
Do **not** settle for:
- first mention only
- first occurrence only
- isolated proof texts
- convenience placements

For any meaningful placement decision, especially Tier 3 and Tier 4:
- review the relevant original source text comprehensively
- review the extracted references and spatial claims
- prefer repeated and converging internal evidence
- clearly distinguish:
  - **text-driven**
  - **inference-driven**
  - **readability-driven**
    decisions

---

## Approved Source Base
Use only the following source layers unless the user explicitly expands scope:

### Original text
- `data/bom_text/`
  - canonical original source text for direct verse review

### Structured project data
- `data/core/locations.json`
- `data/core/references.json`
- `data/core/location_mentions.json`
- `data/core/spatial_claims.json`

### Working app / transform files
- `src/data/transforms/buildRelationalLayout.ts`
- `src/data/transforms/prepareRenderableMapDataset.ts`
- `src/components/map/MapCanvas.tsx`
- `src/components/map/MapDemo.tsx`
- `src/components/map/MapControls.tsx`

---

## Current Project Phase
The project is in the **relational placement refinement phase**.

We are:
- using marker-based placement first
- validating locations by internal textual relationships
- refining Tier 1, Tier 3, and now Tier 4 by attachment family
- using search/highlight in the UI to find nodes more efficiently
- delaying final underlay artwork until the relational backbone is stable

---

## Placement Philosophy
### Required order
1. **Text-governed placement**
2. **Structured-claim placement**
3. **Disciplined inference**
4. **Readability tuning**

### Never reverse this order
Do not move a location for visual neatness if that breaks a stronger textual or extracted relationship.

### City / land pairs
Where a city and land share the same name:
- they should generally remain in close proximity
- unless the source text strongly indicates otherwise

### Tier behavior
- **Tier 1** = macro anchors
- **Tier 2** = major supporting nodes
- **Tier 3** = now largely shaped and usable
- **Tier 4** = currently under rigorous attachment-family review

---

## Important Preferences for AI Work
### Planning before execution
Before making code or placement recommendations:
- explain the reasoning
- identify whether the move is text-driven, inference-driven, or readability-driven
- state why the recommendation follows from the allowed source base

### Comment quality
In code files and non-JSON files:
- include useful comments
- comments should explain intent and logic
- comments should help future continuation in a new session
- avoid empty or decorative comments

Do **not** add comments inside JSON files.

### Communication style
- explain first, then recommend
- preserve continuity with prior decisions
- avoid introducing new assumptions casually
- when uncertain, say what is known, what is inferred, and what remains unresolved

---

## Current UI / Workflow State
### Search
Search is now working well enough to:
- filter locations live
- select a result
- highlight the selected map object
- populate the right-side info panel

This is now a key part of Tier 4 review.

### Inspector
The right-side info panel should continue to populate from selection state and remain part of the review workflow.

### Zoom / label logic
Zoom thresholds and tier label logic are already in place and should be preserved unless deliberately revised.

---

## Settled Working Principles
These are already agreed and should be preserved:

- original source text only
- no outside data or opinions
- canonical IDs matter
- do not rely on first occurrence alone
- use attachment-family review for Tier 4
- city/land same-name pairs should usually be near each other
- search/highlight is now part of the normal workflow
- explanations should precede major edits
- repo/live-file awareness matters more than pasted fragments

---

## Current Map Status
### Tier 1
Tier 1 anchors are broadly established and usable.

### Tier 3
Tier 3 is mostly reviewed and working, though some minor polish items may remain.

### Tier 4
Tier 4 is actively under review and should be handled by attachment family, not random isolated point movement.

Recent Tier 4 work has included:
- `tower_benjamin`
- `valley_alma`
- `hill_north_of_shilom`
- `land_amulon`
- Zarahemla / Sidon corridor Tier 4 support nodes

### Known active concern
Tier 4 still requires rigorous full-reference review before placements are treated as settled.

---

## Recommended Working Method for New Sessions
When beginning a new session:

1. Read this brief first
2. Inspect the live repo files, not assumed pasted versions
3. Identify the exact current task
4. Confirm the canonical IDs involved
5. Review original source text from `data/bom_text/`
6. Review supporting entries in:
   - `locations.json`
   - `references.json`
   - `location_mentions.json`
   - `spatial_claims.json`
7. Then propose changes with reasoning before editing

---

## Immediate Next-Step Placeholder
Update this section at the end of each session.

Current immediate next step:
- continue Tier 4 refinement by attachment family using search/highlight and original text review first
- verify any unresolved placements against full original source evidence before settling them