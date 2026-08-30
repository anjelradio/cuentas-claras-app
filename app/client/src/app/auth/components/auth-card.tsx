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
        <div className="w-28 h-28 rounded-3xl overflow-hidden shadow-[0_10px_40px_rgba(61,59,255,0.3)]">
          <img 
            alt="Cuentas Claras Logo" 
            className="w-full h-full object-cover" 
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuAHpQb9zbaA8ZAmrOIz9S0xG8nRxMoF6XsnMIcbZVjhO7lYAjBGNTOcsPirT3QHC8eFgG2bOB6zjIBTDBDbI_tWcI-y69l9MKVWxn454-V-bblZ4aePLQBaWEXwiEz8IPFjrrZiKBUDKP87ut0nEqFgsotA6Bh7K8kaqRcouozORglQRCtc_bbTfrycy5yMk-CYhiQ4uWkH7lujZIfn8ktTICq6klnx5ndg5J9AZpd2fpnIwYZz0FjBorqhwnDGtZjd9Zk" 
          />
        </div>
        <h1 className="text-3xl font-bold tracking-wide text-white text-center">Cuentas Claras</h1>
        <p className="text-text-muted text-center text-sm px-4">{description}</p>
      </div>

      {children}
    </div>
  )
}
