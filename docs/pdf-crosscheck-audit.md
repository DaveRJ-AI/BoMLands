# PDF Cross-Check Audit

External source used for comparison:
- `Chart 151: Geographical Names Listed by Scripture Reference`
- John W. Welch and J. Gregory Welch
- extracted from `/Users/davidjenkins/Downloads/151_dd67e6a3d9.pdf`

## Method
- Extracted the PDF text using macOS `PDFKit`.
- Parsed the geography lines into a unique place-name inventory.
- Compared those names against:
  - `data/core/locations.json`
  - `data/core/references.json`
  - `data/core/location_mentions.json`
- Normalized obvious naming differences such as:
  - `Shazer` -> `place_shazer_old_world`
  - `Sidon` -> `river_sidon`
  - `Mormon` -> `place_mormon`
  - `Ani-Anti` -> `city_ani_anti`
  - `Onidah` -> `hill_onidah`

## High-Level Result
- Unique geographic names parsed from the PDF: `91`
- Clearly matched in repo vocabulary: `86`
- Apparent misses caused by PDF extraction artifacts, not real location gaps: `5`
- Referenced location ids missing from `locations.json`: `0`

## Extraction Artifacts, Not Real Gaps
These came from line breaks or OCR-like character issues in the PDF extraction and do not indicate missing repo nodes:
- `ShemIon`
  - corresponds to `Shemlon`
- `land`
- `northward`
- `southward`
- `pass`
  - these came from split forms like `land northward`, `land southward`, and `narrow pass`

## Strong Conclusion
The PDF's place-name inventory is now structurally represented in the repo at the location-node level. In other words:
- the Welch/Welch source did not expose new missing location ids comparable to the earlier `Sidom` / `tower_nephi_garden` issues
- `Shazer` is resolved as a normalization issue, not a missing node

## Secondary Finding: Existing Nodes With No Extracted Reference/Mention Support Yet
The PDF cross-check did expose a different cleanup queue:
- several names already exist as location nodes in `locations.json`
- but they currently have no extracted support in `references.json` or `location_mentions.json`

These are not structural-id failures. They are capture/reconciliation gaps.

### Current queue
- `waters_sebus` (`Sebus`)
- `city_ani_anti` (`Ani-Anti`)
- `city_shimnilom` (`Shimnilom`)
- `city_lemuel` (`Lemuel`)
- `land_midian` (`Midian`)
- `hill_onidah` (`Onidah`)
- `land_siron` (`Siron`)
- `hill_riplah` (`Riplah`)
- `mount_antipas` (`Antipas`)
- `city_zeezrom` (`Zeezrom`)
- `city_gilgal` (`Gilgal`)
- `city_mocum` (`Mocum`)
- `city_onihah` (`Onihah`)
- `city_gadiani` (`Gadiani`)
- `city_gadiomnah` (`Gadiomnah`)
- `city_gimgimno` (`Gimgimno`)
- `city_jacob` (`Jacob`)
- `city_gad` (`Gad`)
- `city_josh` (`Josh`)
- `city_laman` (`Laman`)
- `land_antum` (`Antum`)
- `hill_shim` (`Shim`)
- `city_angola` (`Angola`)
- `land_joshua` (`Joshua`)
- `land_jashon` (`Jashon`)
- `city_shem` (`Shem`)
- `city_teancum` (`Teancum`)
- `city_boaz` (`Boaz`)
- `city_jordan` (`Jordan`)
- `land_moriancumer` (`Moriancumer`)
- `hill_ephraim` (`Ephraim`)
- `city_nehor` (`Nehor`)
- `mount_zerin` (`Zerin`)
- `plains_heshlon` (`Heshlon`)
- `wilderness_akish` (`Akish`)
- `valley_shurr` (`Shurr`)
- `land_ogath` (`Ogath`)
- `tower_sherrizah` (`Sherrizah`)
- `land_moriantum` (`Moriantum`)

## Interpretation
- The repo is now in a strong structural state.
- The next audit/reconciliation opportunity is not "missing places" but "under-supported places."
- Many of the items above are later military, destruction, or Jaredite locations that were not part of the earlier foundational-node passes.

## Recommended Next Step
Run a bounded reconciliation pass for the unsupported-but-real nodes above, probably in batches:
1. missionary / Lamanite conversion geography
2. late Nephite destruction cities
3. Jaredite battle corridor and late-war places
