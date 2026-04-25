import type { EventRecord, EventStepRecord } from "../../types/event";
import type { ChronologyPeriod } from "../../types/toggles";

export function filterEventsByChronology(
  events: EventRecord[],
  selectedPeriods: ChronologyPeriod[]
): EventRecord[] {
  if (selectedPeriods.length === 0) {
    return events;
  }

  return events.filter((event) =>
    event.chronology.periods.some((period) => selectedPeriods.includes(period))
  );
}

export function filterEventStepsByChronology(
  eventSteps: EventStepRecord[],
  selectedPeriods: ChronologyPeriod[]
): EventStepRecord[] {
  if (selectedPeriods.length === 0) {
    return eventSteps;
  }

  return eventSteps.filter((step) =>
    step.chronology.periods.some((period) => selectedPeriods.includes(period))
  );
}