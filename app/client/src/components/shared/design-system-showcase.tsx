const colors = [
  ["Primary", "bg-primary"],
  ["Secondary", "bg-secondary"],
  ["Tertiary", "bg-tertiary"],
  ["Neutral", "bg-neutral"],
  ["Background", "bg-background"],
  ["Surface", "bg-surface"],
  ["Headline", "bg-headline"],
  ["Body", "bg-body"],
  ["Label", "bg-label"],
  ["Success", "bg-success"],
  ["Info", "bg-info"],
  ["Warning", "bg-warning"],
  ["Error", "bg-error"],
] as const;

export function DesignSystemShowcase() {
  return (
    <section aria-labelledby="design-system-title" className="space-y-5">
      <div>
        <p className="font-label text-sm text-label">Sistema de diseño</p>
        <h2 id="design-system-title" className="text-2xl font-semibold">Tokens y tipografía</h2>
      </div>
      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {colors.map(([name, color]) => (
            <div key={name} className="rounded-xl bg-surface p-3 ring-1 ring-foreground/10">
              <div className={`h-12 rounded-lg ${color}`} aria-hidden="true" />
              <p className="mt-2 font-label text-xs text-label">{name}</p>
            </div>
          ))}
        </div>
        <div className="rounded-xl bg-surface p-6 ring-1 ring-foreground/10">
          <p className="font-label text-sm text-label">Roles tipográficos</p>
          <h3 className="mt-5 text-4xl font-semibold">Titulares con intención</h3>
          <p className="mt-4 leading-7 text-body">El texto general utiliza Montserrat para conservar una lectura clara y consistente en toda la aplicación.</p>
          <p className="mt-5 font-label text-sm tracking-wide text-label uppercase">Etiqueta de formulario</p>
        </div>
      </div>
    </section>
  );
}
