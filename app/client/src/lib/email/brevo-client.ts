import "server-only"

import { BrevoClient } from "@getbrevo/brevo"

import type { AuthEmailTemplate } from "@/lib/email/templates"

/** Envía correos transaccionales mediante Brevo sin exponer credenciales al cliente. */
export async function sendTransactionalEmail(
  recipient: { email: string; name?: string },
  template: AuthEmailTemplate,
): Promise<void> {
  const apiKey = process.env.BREVO_API_KEY
  const senderEmail = process.env.BREVO_SENDER_EMAIL
  const senderName = process.env.BREVO_SENDER_NAME

  if (!apiKey || !senderEmail || !senderName) {
    throw new Error("El servicio de correo no está configurado.")
  }

  const brevo = new BrevoClient({ apiKey })
  await brevo.transactionalEmails.sendTransacEmail({
    subject: template.subject,
    htmlContent: template.htmlContent,
    textContent: template.textContent,
    sender: { email: senderEmail, name: senderName },
    to: [{ email: recipient.email, name: recipient.name }],
  })
}
