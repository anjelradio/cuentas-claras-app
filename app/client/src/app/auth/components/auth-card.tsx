import Image from "next/image"
import type { ReactNode } from "react"

/** Contenedor visual uniforme para las rutas de acceso de Cuentas Claras. */
export function AuthCard({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: ReactNode
}) {
  return (
    <div className="w-full max-w-sm mx-auto flex flex-col items-center gap-10 px-6">
      {/* Top: Logo and App Name */}
      <div className="flex flex-col items-center gap-5">
        <Image 
          src="/logo.png"
          alt="Cuentas Claras Logo" 
          width={112}
          height={112}
          priority
          className="h-28 w-28 object-contain" 
        />
        <h1 className="text-3xl font-bold tracking-wide text-white text-center">Cuentas Claras</h1>
        <p className="text-text-muted text-center text-sm px-4">{description}</p>
      </div>

      {children}
    </div>
  )
}
