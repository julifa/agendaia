import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { apiGet, apiPut, ApiError } from "../lib/api";
import type { ApiScheduleBlock, ScheduleBlockInput } from "../types/api";

const WEEKDAYS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

interface Row {
  weekday: number;
  start_time: string;
  end_time: string;
}

export function AdminSchedule() {
  const { staffId } = useParams<{ staffId: string }>();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!staffId) return;
    setLoading(true);
    apiGet<ApiScheduleBlock[]>(`/staff/${staffId}/schedule`)
      .then((blocks) =>
        setRows(
          blocks.map((b) => ({
            weekday: b.weekday,
            start_time: b.start_time.slice(0, 5),
            end_time: b.end_time.slice(0, 5),
          })),
        ),
      )
      .catch((err) => setError(err instanceof Error ? err.message : "No se pudo cargar el horario"))
      .finally(() => setLoading(false));
  }, [staffId]);

  function addRow(weekday: number) {
    setRows((prev) => [...prev, { weekday, start_time: "09:00", end_time: "18:00" }]);
  }

  function updateRow(index: number, field: "start_time" | "end_time", value: string) {
    setRows((prev) => prev.map((r, i) => (i === index ? { ...r, [field]: value } : r)));
  }

  function removeRow(index: number) {
    setRows((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSave() {
    if (!staffId) return;
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const blocks: ScheduleBlockInput[] = rows.map((r) => ({
        weekday: r.weekday,
        start_time: r.start_time,
        end_time: r.end_time,
      }));
      await apiPut(`/staff/${staffId}/schedule`, { blocks });
      setSaved(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo guardar el horario");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <Link to="/admin/staff" className="text-sm text-charcoal/50 underline-offset-2 hover:underline">
        ← Volver a Staff
      </Link>
      <h2 className="mt-2 font-display text-2xl text-charcoal">Horario semanal</h2>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      {saved && <p className="mt-3 text-sm text-champagne">Horario guardado.</p>}
      {loading && <p className="mt-6 text-sm text-charcoal/50">Cargando...</p>}

      {!loading && (
        <div className="mt-6 flex flex-col gap-4">
          {WEEKDAYS.map((label, weekday) => (
            <div key={weekday} className="rounded-2xl border border-baby-pink/30 bg-white/60 p-4">
              <div className="flex items-center justify-between">
                <p className="font-display text-charcoal">{label}</p>
                <button
                  type="button"
                  onClick={() => addRow(weekday)}
                  className="text-xs text-champagne underline-offset-2 hover:underline"
                >
                  + agregar bloque
                </button>
              </div>

              <div className="mt-2 flex flex-col gap-2">
                {rows
                  .map((row, index) => ({ row, index }))
                  .filter(({ row }) => row.weekday === weekday)
                  .map(({ row, index }) => (
                    <div key={index} className="flex items-center gap-2">
                      <input
                        type="time"
                        value={row.start_time}
                        onChange={(e) => updateRow(index, "start_time", e.target.value)}
                        className="rounded-xl border border-charcoal/15 bg-white px-2 py-1 text-sm text-charcoal outline-none focus:border-champagne"
                      />
                      <span className="text-charcoal/40">a</span>
                      <input
                        type="time"
                        value={row.end_time}
                        onChange={(e) => updateRow(index, "end_time", e.target.value)}
                        className="rounded-xl border border-charcoal/15 bg-white px-2 py-1 text-sm text-charcoal outline-none focus:border-champagne"
                      />
                      <button
                        type="button"
                        onClick={() => removeRow(index)}
                        className="text-xs text-charcoal/40 hover:text-red-600"
                      >
                        quitar
                      </button>
                    </div>
                  ))}
              </div>
            </div>
          ))}

          <button
            type="button"
            disabled={saving}
            onClick={() => void handleSave()}
            className="self-start rounded-full bg-baby-pink px-5 py-2 text-sm font-medium text-charcoal transition-colors hover:bg-champagne hover:text-white disabled:opacity-50"
          >
            {saving ? "Guardando..." : "Guardar horario"}
          </button>
        </div>
      )}
    </div>
  );
}
