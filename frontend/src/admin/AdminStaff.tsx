import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiGet, apiPatch, apiPut, ApiError } from "../lib/api";
import type { ApiService, ApiStaff } from "../types/api";

export function AdminStaff() {
  const [staff, setStaff] = useState<ApiStaff[]>([]);
  const [services, setServices] = useState<ApiService[]>([]);
  const [assigned, setAssigned] = useState<Record<string, Set<string>>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [staffRows, serviceRows] = await Promise.all([
        apiGet<ApiStaff[]>("/staff"),
        apiGet<ApiService[]>("/services/mine"),
      ]);
      setStaff(staffRows);
      setServices(serviceRows);

      // No hay un GET /staff/{id}/services: se arma el mapa invirtiendo
      // GET /services/{id}/staff (público) para cada servicio del salón.
      const assignments: Record<string, Set<string>> = {};
      for (const member of staffRows) assignments[member.id] = new Set();

      await Promise.all(
        serviceRows.map(async (service) => {
          const providers = await apiGet<{ id: string; full_name: string }[]>(
            `/services/${service.id}/staff`,
          );
          for (const provider of providers) {
            assignments[provider.id]?.add(service.id);
          }
        }),
      );
      setAssigned(assignments);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo cargar el staff");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function toggleActive(member: ApiStaff) {
    setBusyId(member.id);
    try {
      await apiPatch(`/staff/${member.id}/active`, { is_active: !member.is_active });
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo actualizar el estado");
    } finally {
      setBusyId(null);
    }
  }

  function isAssigned(staffId: string, serviceId: string): boolean {
    return assigned[staffId]?.has(serviceId) ?? false;
  }

  async function toggleService(staffId: string, serviceId: string) {
    const current = assigned[staffId] ?? new Set<string>();
    const next = new Set(current);
    if (next.has(serviceId)) {
      next.delete(serviceId);
    } else {
      next.add(serviceId);
    }
    setBusyId(staffId);
    try {
      await apiPut(`/staff/${staffId}/services`, { service_ids: Array.from(next) });
      setAssigned((prev) => ({ ...prev, [staffId]: next }));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo actualizar el servicio");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <h2 className="font-display text-2xl text-charcoal">Staff</h2>
      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      {loading && <p className="mt-6 text-sm text-charcoal/50">Cargando...</p>}

      <div className="mt-6 flex flex-col gap-4">
        {staff.map((member) => (
          <div
            key={member.id}
            className={`rounded-2xl border border-baby-pink/30 bg-white/60 p-4 ${
              !member.is_active ? "opacity-50" : ""
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-charcoal">{member.full_name}</p>
                <p className="text-sm text-charcoal/60">
                  {member.role === "owner" ? "Dueña" : "Staff"}
                  {member.email ? ` · ${member.email}` : ""}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  to={`/admin/staff/${member.id}/schedule`}
                  className="rounded-full border border-charcoal/20 px-3 py-1.5 text-xs text-charcoal/70 transition-colors hover:border-charcoal/40"
                >
                  Horario
                </Link>
                <button
                  type="button"
                  disabled={busyId === member.id}
                  onClick={() => void toggleActive(member)}
                  className="rounded-full border border-charcoal/20 px-3 py-1.5 text-xs text-charcoal/70 transition-colors hover:border-charcoal/40 disabled:opacity-50"
                >
                  {member.is_active ? "Desactivar" : "Reactivar"}
                </button>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              {services.map((service) => (
                <button
                  key={service.id}
                  type="button"
                  disabled={busyId === member.id}
                  onClick={() => void toggleService(member.id, service.id)}
                  className={`rounded-full border px-3 py-1 text-xs transition-colors disabled:opacity-50 ${
                    isAssigned(member.id, service.id)
                      ? "border-champagne bg-champagne/10 text-champagne"
                      : "border-charcoal/15 text-charcoal/60 hover:border-baby-pink"
                  }`}
                >
                  {service.name}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
