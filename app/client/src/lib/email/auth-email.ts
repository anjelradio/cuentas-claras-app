import "server-only"

import { sendTransactionalEmail } from "@/lib/email/brevo-client"
import { createResetPasswordEmail, createVerificationEmail } from "@/lib/email/templates"

/** Envía el único correo que puede contener el enlace de verificación. */
export async function sendVerificationEmail(input: {
  email: string
  name: string
  url: string
}): Promise<void> {
  await sendTransactionalEmail(
    { email: input.email, name: input.name },
    createVerificationEmail(input.name, input.url),
  )
}

/** Envía el único correo que puede contener el enlace de recuperación. */
export async function sendResetPasswordEmail(input: {
  email: string
  name: string
  url: string
}): Promise<void> {
  await sendTransactionalEmail(
    { email: input.email, name: input.name },
    createResetPasswordEmail(input.name, input.url),
  )
}
