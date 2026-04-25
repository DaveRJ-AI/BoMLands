import type { ReferenceRecord } from "../../types/reference";
import type { LocationMention } from "../../types/locationMention";

export function getReferencesForLocation(
  references: ReferenceRecord[],
  locationMentions: LocationMention[],
  locationId: string
): ReferenceRecord[] {
  const referenceIds = new Set(
    locationMentions
      .filter((mention) => mention.location_id === locationId)
      .map((mention) => mention.reference_id)
  );

  return references.filter((reference) => referenceIds.has(reference.id));
}