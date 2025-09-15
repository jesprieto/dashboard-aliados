import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { supabase, hasSupabaseConfig } from "@/lib/supabase";
import { differenceInCalendarDays, format } from "date-fns";

interface Member {
  full_name: string | null;
  email: string | null;
  phone: string | null;
  membership_expires_at?: string | null;
  expiration_date?: string | null; // fallback naming
}

const MOCK: Member[] = [
  {
    full_name: "Ana López",
    email: "ana@example.com",
    phone: "5551112233",
    membership_expires_at: new Date(Date.now() + 1000 * 60 * 60 * 24 * 15).toISOString(),
  },
  {
    full_name: "Carlos Pérez",
    email: "carlos@example.com",
    phone: "5559998877",
    membership_expires_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
  },
  {
    full_name: "María García",
    email: "maria@example.com",
    phone: "5552223344",
    membership_expires_at: new Date(Date.now() + 1000 * 60 * 60 * 24 * 45).toISOString(),
  },
];

export default function Dashboard() {
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<Member[]>([]);

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
        const filtered = MOCK.filter((m) => {
          const okName = name ? m.full_name === name : true;
          const okEmail = email ? m.email === email : true;
          const okPhone = phone ? m.phone === phone : true;
          return okName && okEmail && okPhone;
        });
        await new Promise((r) => setTimeout(r, 400));
        setResults(filtered);
      } else {
        let query = supabase
          .from("members")
          .select("full_name,email,phone,membership_expires_at,expiration_date");
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

  return (
    <main className="min-h-[calc(100vh-4rem)]">
      <section className="mx-auto max-w-5xl px-4 py-10">
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-6">
          Dashboard de Aliados
        </h1>
        {!hasSupabaseConfig ? (
          <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            Modo demo activo: sin conexión a base de datos. Los resultados se muestran con datos simulados.
          </div>
        ) : null}
        <form
          onSubmit={onSearch}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end bg-white p-4 rounded-2xl border shadow-sm"
        >
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-700">Nombre</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nombre exacto"
              className="h-11 rounded-xl border px-3 outline-none focus:ring-2 focus:ring-jonquil/60"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-700">Correo</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="correo@ejemplo.com"
              className="h-11 rounded-xl border px-3 outline-none focus:ring-2 focus:ring-jonquil/60"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-700">
              Teléfono
            </label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="5551234567"
              className="h-11 rounded-xl border px-3 outline-none focus:ring-2 focus:ring-jonquil/60"
            />
          </div>
          <button
            type="submit"
            className="h-11 rounded-xl bg-jonquil text-black font-semibold hover:brightness-95 transition-colors"
            disabled={loading}
          >
            {loading ? "Buscando..." : "Buscar"}
          </button>
        </form>
        {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}

        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
          {results.map((m, idx) => {
            const exp = getExpiry(m);
            const status = getStatus(m);
            return (
              <div
                key={idx}
                className="rounded-2xl border bg-white p-5 shadow-sm"
              >
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-bold">
                      {m.full_name || "Sin nombre"}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {m.email || "Sin correo"}
                    </p>
                    <p className="text-sm text-gray-600">
                      {m.phone || "Sin teléfono"}
                    </p>
                  </div>
                  <span
                    className={
                      "shrink-0 inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold " +
                      (status.expired
                        ? "bg-jet text-white"
                        : "bg-jonquil text-black")
                    }
                  >
                    {status.label}
                  </span>
                </div>
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                  <div className="rounded-xl bg-gray-50 border p-3">
                    <span className="block text-gray-500">
                      Fecha de expiración
                    </span>
                    <span className="font-medium">
                      {exp ? format(exp, "dd/MM/yyyy HH:mm") : "No disponible"}
                    </span>
                  </div>
                  <div className="rounded-xl bg-gray-50 border p-3">
                    <span className="block text-gray-500">
                      Días para expirar
                    </span>
                    <span
                      className={
                        "font-medium " + (status.expired ? "text-red-600" : "")
                      }
                    >
                      {status.days === null ? "-" : Math.abs(status.days)}
                    </span>
                  </div>
                </div>
                {status.expired ? (
                  <div className="mt-4 rounded-xl border border-red-200 bg-red-50 text-red-700 p-3 text-sm">
                    La membresía ha expirado. Contacta al miembro para renovar.
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>

        {!results.length && !error ? (
          <p className="mt-6 text-sm text-gray-500">
            No hay resultados para mostrar.
          </p>
        ) : null}
      </section>
    </main>
  );
}
