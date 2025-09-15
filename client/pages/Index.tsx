import LogoCarousel from "@/components/LogoCarousel";
import { useAuth } from "@/lib/auth";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Index() {
  const { signIn, user, ready } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) navigate("/dashboard");
  }, [user, navigate]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error } = await signIn(email, password);
    if (error) setError(error);
    setLoading(false);
  }

  return (
    <main>
      <section className="relative isolate">
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-white to-gray-50" />
        <div className="mx-auto max-w-6xl px-4 pt-16 pb-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <div>
              <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight leading-tight">
                Plataforma de Aliados Synergy
              </h1>
              <p className="mt-4 text-gray-600 text-lg">
                Inicia sesión con tu correo y contraseña para acceder al
                Dashboard de Aliados.
              </p>
              {!ready ? (
                <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                  Conecta Supabase y configura VITE_SUPABASE_URL y
                  VITE_SUPABASE_ANON_KEY para habilitar el inicio de sesión.
                </div>
              ) : null}
            </div>
            <form
              onSubmit={onSubmit}
              className="bg-white rounded-2xl border shadow-sm p-6"
            >
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Correo
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="correo@ejemplo.com"
                    className="mt-1 h-12 w-full rounded-xl border px-3 outline-none focus:ring-2 focus:ring-jonquil/60"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Contraseña
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="mt-1 h-12 w-full rounded-xl border px-3 outline-none focus:ring-2 focus:ring-jonquil/60"
                  />
                </div>
                {error ? <p className="text-sm text-red-600">{error}</p> : null}
                <button
                  type="submit"
                  className="w-full h-12 rounded-xl bg-jonquil text-black text-base font-semibold hover:brightness-95 transition-colors"
                  disabled={loading}
                >
                  {loading ? "Ingresando..." : "Ingresar"}
                </button>
              </div>
            </form>
          </div>
        </div>
        <div className="border-t bg-white/60">
          <div className="mx-auto max-w-6xl px-4">
            <LogoCarousel />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14">
        <div className="rounded-3xl border bg-white p-8 md:p-12 shadow-sm">
          <h2 className="text-2xl font-extrabold tracking-tight">
            Construimos comunidad juntos
          </h2>
          <p className="mt-3 text-gray-600 text-lg">
            Los aliados de Synergy impulsan conexiones reales y crecimiento
            sostenible. Tu participación fortalece la red y multiplica el
            impacto.
          </p>
          <div className="mt-6 inline-flex items-center gap-3 rounded-full bg-jonquil text-black px-5 py-3 font-semibold">
            Unidos por la colaboración
          </div>
        </div>
      </section>
    </main>
  );
}
