"use client"

import * as React from "react"
import { ArrowLeft, Banknote, CheckCircle2, Download, QrCode, X } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Sheet, SheetClose, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"

interface SettleExpenseSheetProps {
  amount: string
}

const STITCH_QR_URL = "https://lh3.googleusercontent.com/aida/AEtjO1Vtd784oGY3GDEGATQ5L-IapNtQHTkTiXIYKYvLNomuDsbBAdmIpHZd1RqoJj2exEMkEyTr7EnIA-MLxT828r-HDgBzttH3ptnrHKMCy3HN7O6NZkp9sNc19WQkRn_L85k4XX-em57guo9Yq3NeF9uFw2UyuujaU4PdZqysH7wR-H3o0Nn5lay2ujN7aA5ZTnkAIUfFftVGSxi9H1e6mtwWw2_cUJcp9-oXXpb1AuFn5MhYP5GJiyeptevv"

/** Bottom sheet de pago adaptado de los dos recorridos visuales de Stitch. */
export function SettleExpenseSheet({ amount }: SettleExpenseSheetProps) {
  const [open, setOpen] = React.useState(false)
  const [method, setMethod] = React.useState<"cash" | "qr" | null>(null)

  function closeSheet() {
    setOpen(false)
    window.setTimeout(() => setMethod(null), 200)
  }

  function confirmDemo() {
    toast.success("Pago marcado como demostración. No se realizó ninguna transacción.")
    closeSheet()
  }

  return <><Button type="button" onClick={() => setOpen(true)} className="h-auto w-full rounded-2xl bg-gradient-to-br from-[#5f4dff] to-[#1e1c9e] py-5 text-lg font-bold text-white shadow-[0_10px_40px_rgba(61,59,255,0.3)] transition-all hover:-translate-y-1 hover:from-[#6b5cff] hover:to-[#2624b5] hover:shadow-[0_15px_50px_rgba(61,59,255,0.4)]"><CheckCircle2 className="size-6" aria-hidden="true" />Saldar mi parte ({amount})</Button><Sheet open={open} onOpenChange={(nextOpen) => nextOpen ? setOpen(true) : closeSheet()}><SheetContent side="bottom" showCloseButton={false} className="max-h-[85dvh] overflow-y-auto rounded-t-[32px] border-border bg-overlay-surface p-6 text-headline sm:max-w-lg"><div className="mx-auto -mt-2 mb-3 h-1.5 w-12 rounded-full bg-headline/15" /><SheetHeader className="flex-row items-start justify-between p-0"><div>{method && <button type="button" onClick={() => setMethod(null)} className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-headline"><ArrowLeft className="size-4" aria-hidden="true" />Volver</button>}<SheetTitle className="text-xl">{method === "cash" ? "Pago en efectivo" : method === "qr" ? "Pagar con QR" : "Selecciona un método de pago"}</SheetTitle></div><SheetClose render={<Button variant="ghost" size="icon" aria-label="Cerrar pago" />}><X aria-hidden="true" /></SheetClose></SheetHeader>{!method && <div className="mt-6 grid grid-cols-2 gap-4"><button type="button" onClick={() => setMethod("cash")} className="flex aspect-square flex-col items-center justify-center gap-3 rounded-2xl bg-gradient-to-br from-[#5f4dff] to-[#1e1c9e] p-4 text-center text-white shadow-lg transition-all hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><span className="flex size-12 items-center justify-center rounded-full bg-white/20"><Banknote className="size-6" aria-hidden="true" /></span><span><span className="block text-sm font-semibold">Pagar en efectivo</span><span className="mt-1 block text-[10px] text-white/80">Dinero en persona</span></span></button><button type="button" onClick={() => setMethod("qr")} className="flex aspect-square flex-col items-center justify-center gap-3 rounded-2xl bg-gradient-to-br from-tertiary to-secondary p-4 text-center text-white shadow-lg transition-all hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><span className="flex size-12 items-center justify-center rounded-full bg-white/20"><QrCode className="size-6" aria-hidden="true" /></span><span><span className="block text-sm font-semibold">Pagar con QR</span><span className="mt-1 block text-[10px] text-white/80">Transferencia rápida</span></span></button></div>}{method === "cash" && <div className="mt-6 grid gap-6"><div className="rounded-2xl border border-action-orange/20 bg-action-orange/10 p-4 text-sm leading-relaxed text-action-orange">Has seleccionado pago en efectivo. Debes entregar el dinero a la persona que pagó. Se le notificará para que confirme la recepción.</div><Button type="button" onClick={confirmDemo} className="h-14 rounded-2xl bg-action-orange text-base font-semibold text-action-orange-foreground shadow-lg shadow-action-orange/30 hover:bg-action-orange/90">Confirmar demostración</Button></div>}{method === "qr" && <div className="mt-6 grid gap-5"><div role="img" aria-label="Código QR de pago" className="mx-auto size-48 rounded-2xl bg-white bg-contain bg-center bg-no-repeat p-4" style={{ backgroundImage: `url(${STITCH_QR_URL})` }} /><Button type="button" onClick={confirmDemo} className="h-14 rounded-2xl bg-tertiary text-base font-semibold text-white shadow-lg shadow-tertiary/30 hover:bg-tertiary/90">Confirmar demostración</Button><Button type="button" variant="outline" className="h-14 rounded-2xl"><Download className="size-5" aria-hidden="true" />Descargar QR</Button></div>}</SheetContent></Sheet></>
}
