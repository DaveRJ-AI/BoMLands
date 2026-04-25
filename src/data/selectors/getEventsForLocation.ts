import type { EventRecord, EventStepRecord } from "../../types/event";

export function getEventsForLocation(
  events: EventRecord[],
  eventSteps: EventStepRecord[],
  locationId: string
): EventRecord[] {
  const eventIds = new Set(
    eventSteps
      .filter(
        (step) =>
          step.from_location_id === locationId ||
          step.to_location_id === locationId
      )
      .map((step) => step.event_id)
  );

  return events.filter((event) => eventIds.has(event.event_id));
}