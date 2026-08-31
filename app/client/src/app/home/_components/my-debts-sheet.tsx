"use client"

import * as React from "react"
import { Wallet, ArrowLeft, ArrowUpRight, ArrowDownLeft, Layout, X } from "lucide-react"

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose
} from "@/components/ui/sheet"
import { QuickActionButton } from "@/components/custom/quick-action-button"

export function MyDebtsSheet() {
  const [open, setOpen] = React.useState(false)
  const [step, setStep] = React.useState<"select" | "owe" | "owed">("select")

  React.useEffect(() => {
    if (!open) {
      setTimeout(() => setStep("select"), 300)
    }
  }, [open])

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger render={
        <QuickActionButton
          icon={Layout}
          title="Mis deudas"
          description="Gestiona lo que debes y lo que te deben"
          variant="secondary-purple"
        />
      } />
      
      <SheetContent showCloseButton={false} side="bottom" className="bg-[#181b27] border-border text-white rounded-t-[32px] p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-center mb-6">
          <div className="w-12 h-1.5 bg-white/20 rounded-full"></div>
        </div>

        {step === "select" && (
          <div className="flex flex-col h-full animate-in fade-in slide-in-from-bottom-4 duration-300">
            <SheetHeader className="mb-6 p-0 flex flex-row justify-between items-center space-y-0">
              <SheetTitle className="text-2xl font-semibold text-white">Mis deudas</SheetTitle>
              <SheetClose render={
                <button className="text-muted-foreground hover:text-white transition-colors p-1" aria-label="Cerrar">
                  <X className="size-6" />
                </button>
              } />
            </SheetHeader>
            
            <div className="flex flex-col gap-3 mb-8">
              <button 
                onClick={() => setStep("owe")}
                className="flex items-center justify-between p-4 rounded-2xl hover:bg-white/5 transition-colors cursor-pointer border border-border w-full text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#ef4444]/10 rounded-full flex items-center justify-center text-[#ef4444] shrink-0">
                    <ArrowUpRight className="size-5" />
                  </div>
                  <div>
                    <h4 className="font-medium text-white mb-0.5">Lo que debes</h4>
                    <p className="text-xs text-muted-foreground">Bs. 350.50 en total</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-sm font-semibold text-[#ef4444]">- Bs. 350.50</span>
                </div>
              </button>

              <button 
                onClick={() => setStep("owed")}
                className="flex items-center justify-between p-4 rounded-2xl hover:bg-white/5 transition-colors cursor-pointer border border-border w-full text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#22c55e]/10 rounded-full flex items-center justify-center text-[#22c55e] shrink-0">
                    <ArrowDownLeft className="size-5" />
                  </div>
                  <div>
                    <h4 className="font-medium text-white mb-0.5">Lo que te deben</h4>
                    <p className="text-xs text-muted-foreground">Bs. 120.00 en total</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-sm font-semibold text-[#22c55e]">+ Bs. 120.00</span>
                </div>
              </button>
            </div>
          </div>
        )}

        {step === "owe" && (
          <div className="flex flex-col h-full animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <button onClick={() => setStep("select")} className="p-2 -ml-2 rounded-full hover:bg-white/10 transition-colors">
                  <ArrowLeft className="size-5" />
                </button>
                <h3 className="text-2xl font-semibold text-white">Lo que debes</h3>
              </div>
              <SheetClose render={
                <button className="text-muted-foreground hover:text-white transition-colors p-1" aria-label="Cerrar">
                  <X className="size-6" />
                </button>
              } />
            </div>
            
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition-colors border-b border-border last:border-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#2d314f] rounded-full flex items-center justify-center text-sm font-medium">MI</div>
                  <div>
                    <h4 className="font-medium text-white mb-0.5">Miguel</h4>
                    <p className="text-xs text-muted-foreground">Samaipata 2026</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-[#ef4444]">Bs. 15.50</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {step === "owed" && (
          <div className="flex flex-col h-full animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <button onClick={() => setStep("select")} className="p-2 -ml-2 rounded-full hover:bg-white/10 transition-colors">
                  <ArrowLeft className="size-5" />
                </button>
                <h3 className="text-2xl font-semibold text-white">Lo que te deben</h3>
              </div>
              <SheetClose render={
                <button className="text-muted-foreground hover:text-white transition-colors p-1" aria-label="Cerrar">
                  <X className="size-6" />
                </button>
              } />
            </div>
            
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition-colors border-b border-border last:border-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#2d314f] rounded-full flex items-center justify-center text-sm font-medium">CA</div>
                  <div>
                    <h4 className="font-medium text-white mb-0.5">Carlos</h4>
                    <p className="text-xs text-muted-foreground">Cena de cumpleaños</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-[#22c55e]">Bs. 120.00</p>
                </div>
              </div>
            </div>
          </div>
        )}

      </SheetContent>
    </Sheet>
  )
}
