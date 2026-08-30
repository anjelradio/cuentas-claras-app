import Link from "next/link"
import { MailCheck } from "lucide-react"

/** Indica que el siguiente paso es abrir el enlace recibido por correo. */
export function CheckEmailCard() {
  return (
    <div className="w-full flex flex-col items-center gap-4 text-center">
      <MailCheck className="size-16 text-[#ff6b35]" aria-hidden="true" />
      <p className="text-sm leading-6 text-muted-foreground px-4">Te enviamos un enlace de un solo uso. Abre tu correo y verifícalo para entrar a tu cuenta.</p>
      <Link 
        className="w-full px-4 py-4 mt-2 rounded-xl text-white font-semibold text-lg transition-all border border-border bg-white/5 hover:bg-white/10" 
        href="/auth/login"
      >
        Volver a iniciar sesión
      </Link>
    </div>
  )
}
