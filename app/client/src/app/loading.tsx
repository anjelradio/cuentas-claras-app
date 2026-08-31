import { Loader2 } from "lucide-react"

export default function GlobalLoading() {
  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="flex flex-col items-center gap-4 p-8 glass-panel rounded-3xl shadow-2xl">
        <div className="relative flex items-center justify-center">
          {/* Outer glow ring */}
          <div className="absolute inset-0 rounded-full blur-xl bg-primary/30 animate-pulse" />
          
          {/* Main spinner */}
          <Loader2 className="relative size-12 text-[#5f4dff] animate-spin" />
        </div>
        
        <h3 className="text-lg font-medium text-white tracking-wide animate-pulse">
          Cargando...
        </h3>
      </div>
    </div>
  )
}
