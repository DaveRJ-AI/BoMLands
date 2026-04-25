import type { ToggleState, ChronologyPeriod } from "../../types/toggles";

export interface OverlayEventOption {
  id: string;
  label: string;
}

export interface MapControlsProps {
  toggles: ToggleState;
  selectedChronology: ChronologyPeriod[];
  overlayEventOptions: OverlayEventOption[];
  selectedOverlayEventId: string;
  onSelectedOverlayEventIdChange: (eventId: string) => void;
  onToggleChange: <K extends keyof ToggleState>(key: K, value: ToggleState[K]) => void;
  onChronologyChange: (periods: ChronologyPeriod[]) => void;
  onReset: () => void;
}

export default function MapControls({
  toggles,
  overlayEventOptions,
  selectedOverlayEventId,
  onSelectedOverlayEventIdChange,
  onToggleChange
}: MapControlsProps) {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
        <div className="mb-3 text-sm font-medium text-slate-800">Overlays</div>

        <div className="space-y-3">
          <div>
            <div className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-500">
              Overlay Type
            </div>
            <select
              value={toggles.event_overlay_mode}
              onChange={(event) =>
                onToggleChange(
                  "event_overlay_mode",
                  event.target.value as ToggleState["event_overlay_mode"]
                )
              }
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700"
            >
              <option value="none">None</option>
              <option value="migration">Migration</option>
              <option value="missionary">Missionary</option>
              <option value="military">Military</option>
              <option value="all">All</option>
            </select>
          </div>

          {toggles.event_overlay_mode !== "none" ? (
            <div>
              <div className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-500">
                Specific Route
              </div>
              <select
                value={selectedOverlayEventId}
                onChange={(event) => onSelectedOverlayEventIdChange(event.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700"
              >
                <option value="all">All routes</option>
                {overlayEventOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          ) : null}

          <div>
            <div className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-500">
              Overlay Path Rendering
            </div>
            <select
              value={toggles.campaign_render_mode}
              onChange={(event) =>
                onToggleChange(
                  "campaign_render_mode",
                  event.target.value as ToggleState["campaign_render_mode"]
                )
              }
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700"
            >
              <option value="sequence_only">Sequence Only</option>
              <option value="point_to_point">Point to Point</option>
              <option value="inferred_route">Inferred Route</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
