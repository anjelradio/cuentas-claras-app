"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { CheckCircle2 } from "lucide-react"
import { toast } from "sonner"

import { CheckEmailCard } from "@/app/auth/components/check-email-card"
import { getAuthErrorMessage } from "@/lib/auth-errors"
import { authClient } from "@/lib/auth-client"

/** Muestra la espera de verificación y procesa enlaces que incluyen un token. */
export function VerifyEmailStatus() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get("token")
  const [isVerifying, setIsVerifying] = useState(Boolean(token))

  useEffect(() => {
    const verificationToken = token
    if (!verificationToken) {
      return
    }
    const tokenToVerify: string = verificationToken

    async function verify() {
      const result = await authClient.verifyEmail({ query: { token: tokenToVerify, callbackURL: "/" } })
      if (result.error) {
        toast.error(getAuthErrorMessage(result.error))
        setIsVerifying(false)
        return
      }

      toast.success("Tu correo fue verificado correctamente.")
      router.replace("/")
    }

    void verify()
  }, [router, token])

  if (isVerifying) {
    return <div className="flex items-center gap-3 text-sm text-body"><CheckCircle2 className="size-5 animate-pulse text-primary" aria-hidden="true" /> Verificando tu correo…</div>
  }

  return <CheckEmailCard />
}
