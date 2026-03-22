/* eslint-disable @next/next/no-img-element */
export default function LogoPreview() {
  const logos = [
    { file: "/logo-option-1.svg", name: "Option 1: Clean Modern", desc: "Stacked cards icon with green '702' and blue 'ManyCards'. Clean and professional." },
    { file: "/logo-option-2.svg", name: "Option 2: Badge Style", desc: "Blue badge with '702' inside, 'MANY CARDS' stacked with green accent line. Premium feel." },
    { file: "/logo-option-3.svg", name: "Option 3: Deck + Lightning", desc: "Card deck icon with lightning bolt, '702' green, 'many' gray, 'cards' blue. Dynamic energy." },
    { file: "/logo-option-4.svg", name: "Option 4: Yu-Gi-Oh Card Frame", desc: "Logo shaped like a Yu-Gi-Oh card with '702' inside, stars, and ATK/DEF style bar. TCG-themed." },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-2">Logo Options for 702ManyCards</h1>
      <p className="text-[var(--color-text-secondary)] mb-8">Pick your favorite — or tell me what to change.</p>

      <div className="space-y-8">
        {logos.map((logo, i) => (
          <div key={i} className="p-8 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)]">
            <h2 className="text-lg font-semibold mb-1">{logo.name}</h2>
            <p className="text-sm text-[var(--color-text-secondary)] mb-6">{logo.desc}</p>

            {/* Light background */}
            <div className="p-6 rounded-lg bg-white mb-4">
              <img src={logo.file} alt={logo.name} className="h-16 w-auto" />
            </div>

            {/* Dark background */}
            <div className="p-6 rounded-lg bg-[#0F0F0F]">
              <img src={logo.file} alt={`${logo.name} on dark`} className="h-16 w-auto" style={{ filter: "brightness(1.1)" }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
