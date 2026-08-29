import { ComponentCollectionShowcase } from "@/components/shared/component-collection-showcase";
import { DesignSystemShowcase } from "@/components/shared/design-system-showcase";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-5 py-10 sm:px-8 lg:px-12">
      <header className="max-w-3xl space-y-3">
        <p className="font-label text-sm tracking-[0.18em] text-label uppercase">
          Cuentas Claras
        </p>
        <h1 className="text-4xl leading-tight font-semibold sm:text-5xl">
          Fundación visual lista para construir
        </h1>
        <p className="max-w-2xl text-base leading-7 text-body">
          Tokens centralizados, tipografías con roles definidos y componentes
          accesibles para las futuras funcionalidades del producto.
        </p>
      </header>
      <DesignSystemShowcase />
      <ComponentCollectionShowcase />
    </main>
  );
}
