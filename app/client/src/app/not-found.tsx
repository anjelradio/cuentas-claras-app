import Link from "next/link"

/** Informa que una ruta no existe sin sustituirlo por una notificación breve. */
export default function NotFound() {
  return <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-5 text-center"><h1 className="text-2xl">Esta página no existe</h1><Link className="inline-flex h-9 items-center rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground hover:bg-primary/80" href="/">Ir a inicio</Link></main>
}
