import { useEffect, useRef, useState } from "react";
import { AllyProfile, loadProfile, saveProfile } from "@/lib/profile";

export default function Profile() {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [profile, setProfile] = useState<AllyProfile>(loadProfile());
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  useEffect(() => {
    // hydrate on mount in case other tabs changed it
    setProfile(loadProfile());
  }, []);

  function onPickFile() {
    fileRef.current?.click();
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setProfile((p) => ({ ...p, avatarDataUrl: reader.result as string }));
    };
    reader.readAsDataURL(file);
  }

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await new Promise((r) => setTimeout(r, 400));
    saveProfile(profile);
    setSaving(false);
    setSavedAt(Date.now());
  }

  function onRemovePhoto() {
    setProfile((p) => ({ ...p, avatarDataUrl: null }));
  }

  return (
    <main className="min-h-[calc(100vh-4rem)]">
      <section className="mx-auto max-w-4xl px-4 py-10">
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-6">
          Perfil del Aliado
        </h1>

        <form onSubmit={onSave} className="space-y-8">
          <div className="rounded-2xl border bg-white shadow-sm p-6 flex flex-col md:flex-row items-start gap-6">
            <div className="relative">
              {profile.avatarDataUrl ? (
                <img
                  src={profile.avatarDataUrl}
                  alt={`Foto de ${profile.businessName || "Aliado"}`}
                  className="h-32 w-32 md:h-36 md:w-36 rounded-2xl object-cover border"
                />
              ) : (
                <div className="h-32 w-32 md:h-36 md:w-36 rounded-2xl bg-gray-100 border grid place-items-center text-3xl font-bold text-gray-500">
                  {(profile.businessName || "A").charAt(0)}
                </div>
              )}
            </div>
            <div className="flex-1 w-full">
              <p className="text-sm text-gray-600 mb-3">
                Sube una imagen cuadrada para mejores resultados (PNG o JPG).
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={onPickFile}
                  className="inline-flex items-center rounded-xl bg-jonquil text-black px-4 py-2 font-semibold hover:brightness-95"
                >
                  Cambiar foto
                </button>
                {profile.avatarDataUrl ? (
                  <button
                    type="button"
                    onClick={onRemovePhoto}
                    className="inline-flex items-center rounded-xl border px-4 py-2 font-semibold hover:bg-gray-50"
                  >
                    Quitar foto
                  </button>
                ) : null}
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/png,image/jpeg,image/jpg"
                  className="hidden"
                  onChange={onFileChange}
                />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border bg-white shadow-sm p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="text-sm font-medium text-gray-700">
                Nombre del comercio
              </label>
              <input
                value={profile.businessName}
                onChange={(e) =>
                  setProfile((p) => ({ ...p, businessName: e.target.value }))
                }
                placeholder="Ej. Café Synergy"
                className="mt-1 h-11 w-full rounded-xl border px-3 outline-none focus:ring-2 focus:ring-jonquil/60"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">
                Número de contacto
              </label>
              <input
                value={profile.contactNumber}
                onChange={(e) =>
                  setProfile((p) => ({ ...p, contactNumber: e.target.value }))
                }
                placeholder="Ej. +57 300 123 4567"
                className="mt-1 h-11 w-full rounded-xl border px-3 outline-none focus:ring-2 focus:ring-jonquil/60"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center rounded-xl bg-jonquil text-black px-6 py-3 font-semibold hover:brightness-95 disabled:opacity-70"
            >
              {saving ? "Guardando..." : "Guardar cambios"}
            </button>
            {savedAt ? (
              <span className="text-sm text-gray-600">Cambios guardados</span>
            ) : null}
          </div>
        </form>
      </section>
    </main>
  );
}
