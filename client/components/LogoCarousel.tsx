const BRANDS = [
  "Synergy Labs",
  "Nova",
  "Atria",
  "Helios",
  "Quanta",
  "Nimbus",
  "Vertex",
  "Orbit",
  "Atlas",
  "Lumen",
  "Pulse",
  "Flux",
];

export default function LogoCarousel() {
  return (
    <div className="overflow-hidden py-6 select-none">
      <div
        className="flex gap-8 whitespace-nowrap animate-marquee [--gap:2rem]"
        aria-label="Marcas aliadas"
      >
        {[...BRANDS, ...BRANDS].map((name, i) => (
          <div
            key={i}
            className="inline-flex items-center gap-3 px-4 py-2 rounded-full border bg-white shadow-sm text-sm text-gray-700"
          >
            <div className="h-8 w-8 rounded-full bg-gray-900 text-jonquil grid place-items-center font-bold">
              {name
                .split(" ")
                .map((w) => w[0])
                .join("")}
            </div>
            <span className="font-semibold">{name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
