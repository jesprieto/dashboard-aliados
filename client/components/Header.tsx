import { useAuth } from "@/lib/auth";
import { Link, useLocation, useNavigate } from "react-router-dom";

export default function Header() {
  const { user, signOut, ready } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const onLogout = async () => {
    await signOut();
    if (location.pathname !== "/") navigate("/");
  };
  return (
    <header className="sticky top-0 z-20 w-full border-b bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="mx-auto max-w-6xl px-4 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-jonquil/90 grid place-items-center text-black font-bold">
            S
          </div>
          <span className="text-lg sm:text-xl font-extrabold tracking-tight">
            Plataforma de Aliados Synergy
          </span>
        </Link>
        <div className="flex items-center gap-3">
          {ready && user ? (
            <button
              onClick={onLogout}
              className="inline-flex items-center rounded-full bg-gray-900 text-white px-4 py-2 text-sm font-semibold hover:bg-gray-800 transition-colors"
            >
              Cerrar sesión
            </button>
          ) : null}
        </div>
      </div>
    </header>
  );
}
