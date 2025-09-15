import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/auth";
import { supabase, hasSupabaseConfig } from "@/lib/supabase";
import { differenceInCalendarDays, format } from "date-fns";
import { loadProfile } from "@/lib/profile";
import { Link } from "react-router-dom";
import { CalendarDays, Star } from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
} from "recharts";

interface Member {
  full_name: string | null;
  email: string | null;
  phone: string | null;
  membership_expires_at?: string | null;
  expiration_date?: string | null;
}

interface ValidationItem {
  id: string;
  member: string;
  avatar?: string | null;
  date: string; // ISO
  status: "Activo" | "Expirado" | "Suspendido";
  weeklyVisits: number;
}

function range(n: number) {
  return Array.from({ length: n }, (_, i) => i);
}

function buildDemoValidations(): ValidationItem[] {
  const names = [
    "Ana López",
    "Carlos Pérez",
    "María García",
    "Luis Martínez",
    "Sofía Ramírez",
    "Jorge Torres",
    "Lucía Fernández",
    "Pedro Gómez",
  ];
  const out: ValidationItem[] = [];
  const now = new Date();
  for (let i = 0; i < 70; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() - Math.floor(Math.random() * 28));
    d.setHours(9 + Math.floor(Math.random() * 10));
    const name = names[Math.floor(Math.random() * names.length)];
    const visits = Math.floor(Math.random() * 9);
    const status: ValidationItem["status"] = Math.random() < 0.85 ? "Activo" : Math.random() < 0.5 ? "Expirado" : "Suspendido";
    out.push({
      id: `${i}`,
      member: name,
      avatar: null,
      date: d.toISOString(),
      status,
      weeklyVisits: visits,
    });
  }
  return out.sort((a, b) => +new Date(b.date) - +new Date(a.date));
}

export default function Dashboard() {
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<Member[]>([]);
  const [ally, setAlly] = useState(loadProfile());

  const demoData = useMemo(() => buildDemoValidations(), []);

  useEffect(() => {
    setAlly(loadProfile());
  }, []);

  useEffect(() => {
    setResults([]);
    setError(null);
  }, [name, email, phone]);

  async function onSearch(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setResults([]);
    if (!name && !email && !phone) {
      setError("Ingresa al menos un campo para buscar");
      return;
    }
    setLoading(true);
    try {
      if (!hasSupabaseConfig) {
        // Demo: filter by exact fields against mock members list derived from validations
        const uniqueMembers = Array.from(
          new Set(demoData.map((d) => d.member)),
        ).map((full_name) => ({ full_name, email: null, phone: null } as Member));
        const filtered = uniqueMembers.filter((m) => {
          const okName = name ? m.full_name === name : true;
          const okEmail = email ? m.email === email : true;
          const okPhone = phone ? m.phone === phone : true;
          return okName && okEmail && okPhone;
        });
        await new Promise((r) => setTimeout(r, 300));
        setResults(filtered);
      } else {
        let query = supabase
          .from("members")
          .select(
            "full_name,email,phone,membership_expires_at,expiration_date",
          );
        if (name) query = query.eq("full_name", name);
        if (email) query = query.eq("email", email);
        if (phone) query = query.eq("phone", phone);
        const { data, error } = await query;
        if (error) throw error;
        setResults(data ?? []);
      }
    } catch (err: any) {
      setError(err.message ?? "Error en la búsqueda");
    } finally {
      setLoading(false);
    }
  }

  function getExpiry(member: Member) {
    const raw = member.membership_expires_at ?? member.expiration_date ?? null;
    if (!raw) return null;
    const d = new Date(raw);
    if (isNaN(d.getTime())) return null;
    return d;
  }

  function getStatus(member: Member) {
    const d = getExpiry(member);
    if (!d)
      return {
        label: "Desconocido",
        expired: false,
        days: null as number | null,
      };
    const now = new Date();
    const days = differenceInCalendarDays(d, now);
    const expired = days < 0;
    return { label: expired ? "Expirado" : "Activo", expired, days };
  }

  // KPIs from demo data
  const kpis = useMemo(() => {
    const now = new Date();
    const month = now.getMonth();
    const year = now.getFullYear();
    const monthData = demoData.filter((d) => {
      const dd = new Date(d.date);
      return dd.getMonth() === month && dd.getFullYear() === year;
    });
    const total = monthData.length;
    const unique = new Set(monthData.map((d) => d.member)).size;
    const avgPerMember = unique ? (total / unique) : 0;
    return {
      total,
      unique,
      avg: Math.round(avgPerMember * 10) / 10,
    };
  }, [demoData]);

  // Line chart: validations by week (last 8 weeks)
  const lineData = useMemo(() => {
    const now = new Date();
    const start = new Date(now);
    start.setDate(start.getDate() - 7 * 7);
    const weeks: { label: string; count: number }[] = [];
    for (let i = 7; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i * 7);
      const label = format(d, "dd/MM");
      weeks.push({ label, count: 0 });
    }
    demoData.forEach((v) => {
      const vd = new Date(v.date);
      for (let i = 0; i < weeks.length; i++) {
        const base = new Date(now);
        base.setDate(base.getDate() - (7 - i) * 7);
        const next = new Date(base);
        next.setDate(base.getDate() + 7);
        if (vd >= base && vd < next) {
          weeks[i].count++;
          break;
        }
      }
    });
    return weeks;
  }, [demoData]);

  // Heatmap: day x hour counts
  const heatmap = useMemo(() => {
    const days = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
    const hours = range(12).map((i) => 9 + i); // 9:00 - 20:00
    const grid: Record<string, number> = {};
    demoData.forEach((v) => {
      const d = new Date(v.date);
      const day = (d.getDay() + 6) % 7; // Mon=0
      const hour = d.getHours();
      if (hour < 9 || hour > 20) return;
      const key = `${day}-${hour}`;
      grid[key] = (grid[key] || 0) + 1;
    });
    const max = Math.max(1, ...Object.values(grid));
    return { days, hours, grid, max };
  }, [demoData]);

  // Comparison bar: this ally vs others (demo numbers)
  const comparison = useMemo(() => {
    const mine = kpis.total;
    const others = Math.round(mine * (0.7 + Math.random() * 0.6));
    return [
      { name: "Este mes", Yo: mine, Promedio: others },
    ];
  }, [kpis.total]);

  return (
    <main className="min-h-[calc(100vh-4rem)]">
      <section className="mx-auto max-w-6xl px-4 py-10">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-2 text-black">
          Dashboard de Aliados Synergy.
        </h1>
        <div className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-2 text-black">
          <p><strong>Dashboard </strong>de Aliados Synergy.</p>
        </div>
        <p className="text-sm text-gray-600 mb-6">Panel de control y actividad</p>

        {!hasSupabaseConfig ? (
          <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            Modo demo activo: sin conexión a base de datos. Los resultados se muestran con datos simulados.
          </div>
        ) : null}

        {/* Perfil resumen */}
        <div className="mb-6 rounded-2xl border bg-white p-4 shadow-sm flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {ally.avatarDataUrl ? (
              <img src={ally.avatarDataUrl} alt="Avatar del comercio" className="h-14 w-14 rounded-full object-cover border" />
            ) : (
              <div className="h-14 w-14 rounded-full bg-gray-100 border grid place-items-center text-xl font-bold text-gray-500">
                {(ally.businessName || "A").charAt(0)}
              </div>
            )}
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500">Mi comercio</p>
              <p className="text-lg font-semibold">{ally.businessName || "Aliado Synergy"}</p>
              {ally.contactNumber ? (
                <p className="text-sm text-gray-600">{ally.contactNumber}</p>
              ) : null}
            </div>
          </div>
          <Link to="/perfil" className="inline-flex items-center rounded-xl border px-4 py-2 font-semibold hover:bg-gray-50">Editar perfil</Link>
        </div>

        {/* Buscar miembro */}
        <h2 className="text-2xl font-extrabold tracking-tight mb-2">Buscar miembro</h2>
        <form onSubmit={onSearch} className="flex items-end gap-3 bg-white p-3 rounded-xl border shadow-sm mb-4 overflow-x-auto">
          <div className="flex flex-col gap-1 min-w-[200px]">
            <label className="text-xs font-medium text-gray-700">Nombre</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nombre exacto" className="h-10 rounded-lg border px-3 outline-none focus:ring-2 focus:ring-jonquil/60" />
          </div>
          <div className="flex flex-col gap-1 min-w-[220px]">
            <label className="text-xs font-medium text-gray-700">Correo</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="correo@ejemplo.com" className="h-10 rounded-lg border px-3 outline-none focus:ring-2 focus:ring-jonquil/60" />
          </div>
          <div className="flex flex-col gap-1 min-w-[180px]">
            <label className="text-xs font-medium text-gray-700">Teléfono</label>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="5551234567" className="h-10 rounded-lg border px-3 outline-none focus:ring-2 focus:ring-jonquil/60" />
          </div>
          <button type="submit" className="h-10 rounded-lg bg-jonquil text-black font-semibold px-4 hover:brightness-95 transition-colors" disabled={loading}>{loading ? "Buscando..." : "Buscar"}</button>
        </form>

        {/* KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="rounded-2xl border bg-white shadow-sm p-5">
            <p className="text-sm text-gray-600">Validaciones este mes</p>
            <p className="mt-2 text-2xl font-extrabold">{kpis.total}</p>
          </div>
          <div className="rounded-2xl border bg-white shadow-sm p-5">
            <p className="text-sm text-gray-600">Miembros únicos atendidos</p>
            <p className="mt-2 text-2xl font-extrabold">{kpis.unique}</p>
          </div>
          <div className="rounded-2xl border bg-white shadow-sm p-5">
            <p className="text-sm text-gray-600">Visitas promedio por miembro</p>
            <p className="mt-2 text-2xl font-extrabold">{kpis.avg}</p>
          </div>
        </div>

        {/* Charts grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="rounded-2xl border bg-white shadow-sm p-6">
            <p className="mb-4 font-semibold">Validaciones por semana</p>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={lineData} margin={{ top: 5, right: 10, bottom: 0, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Line type="monotone" dataKey="count" stroke="hsl(var(--jonquil))" strokeWidth={3} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="flex flex-col gap-6">
            <div className="rounded-2xl border bg-white shadow-sm p-6">
              <p className="mb-4 font-semibold">Mapa de calor: Visitas por día y hora</p>
              <div className="grid" style={{ gridTemplateColumns: `auto repeat(${heatmap.hours.length}, minmax(0, 1fr))` }}>
                <div />
                {heatmap.hours.map((h) => (
                  <div key={h} className="text-[10px] text-gray-500 text-center">{h}:00</div>
                ))}
                {heatmap.days.map((d, di) => (
                  <>
                    <div key={`l-${d}`} className="text-xs text-gray-600 pr-2 py-1">{d}</div>
                    {heatmap.hours.map((h) => {
                      const key = `${di}-${h}`;
                      const v = heatmap.grid[key] || 0;
                      const intensity = v / heatmap.max; // 0..1
                      const bg = `hsla(49, 100%, ${40 + Math.round(intensity * 35)}%, 1)`; // jonquil scale
                      return (
                        <div key={key} className="h-6 w-full rounded-md border" style={{ background: v ? bg : "#f5f5f5" }} />
                      );
                    })}
                  </>
                ))}
              </div>
            </div>
            <div className="rounded-2xl border bg-white shadow-sm p-6">
              <p className="mb-4 font-semibold">Comparativo con el promedio</p>
              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={comparison}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="Yo" fill="hsl(var(--jonquil))" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="Promedio" fill="hsl(var(--aureolin))" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

        {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}

        {/* Listado de validaciones */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {demoData.slice(0, 12).map((v) => {
            const d = new Date(v.date);
            const completed = v.status === "Activo";
            const rejected = v.status === "Expirado" || v.status === "Suspendido";
            return (
              <div key={v.id} className="rounded-2xl border bg-white p-5 shadow-sm flex items-center gap-4">
                {v.avatar ? (
                  <img src={v.avatar} alt={v.member} className="h-12 w-12 rounded-full object-cover border" />
                ) : (
                  <div className="h-12 w-12 rounded-full bg-gray-100 border grid place-items-center font-bold text-gray-600">
                    {v.member.charAt(0)}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold truncate">{v.member}</p>
                    {v.weeklyVisits > 5 ? (
                      <Star className="h-4 w-4" style={{ color: "hsl(var(--aureolin))", fill: "hsl(var(--aureolin))" }} />
                    ) : null}
                  </div>
                  <div className="mt-1 flex items-center gap-2 text-sm text-gray-600">
                    <CalendarDays className="h-4 w-4" style={{ color: "hsl(var(--jonquil))" }} />
                    <span>{format(d, "dd/MM/yyyy HH:mm")}</span>
                  </div>
                </div>
                <span className={
                  "shrink-0 inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold " +
                  (completed ? "bg-green-100 text-green-700 border border-green-200" : "bg-jet text-red-200 border border-red-600")
                }>
                  {completed ? "Completada" : "Rechazada"}
                </span>
              </div>
            );
          })}
        </div>

        {/* Nota si no hay resultados de búsqueda */}
        {!results.length && !error ? (
          <p className="mt-6 text-sm text-gray-500">No hay resultados para mostrar.</p>
        ) : null}
      </section>
    </main>
  );
}
