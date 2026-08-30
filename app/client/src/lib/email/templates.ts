import "server-only"

/** Contenido seguro de un correo transaccional de autenticación. */
export type AuthEmailTemplate = {
  subject: string
  htmlContent: string
  textContent: string
}

/** Construye el correo de verificación con la URL entregada por Better Auth. */
export function createVerificationEmail(name: string, verificationUrl: string): AuthEmailTemplate {
  const safeName = escapeHtml(name || "hola")
  const safeUrl = escapeHtml(verificationUrl)

  return {
    subject: "Verifica tu correo de Cuentas Claras",
    htmlContent: `<main><h1>Verifica tu correo</h1><p>Hola, ${safeName}.</p><p>Confirma que esta dirección es tuya para continuar en Cuentas Claras.</p><p><a href="${safeUrl}">Verificar mi correo</a></p><p>Este enlace vence en una hora y solo puede usarse una vez.</p></main>`,
    textContent: `Hola, ${name || ""}. Verifica tu correo en Cuentas Claras: ${verificationUrl}. El enlace vence en una hora y solo puede usarse una vez.`,
  }
}

/** Construye el correo de recuperación con la URL entregada por Better Auth. */
export function createResetPasswordEmail(name: string, resetUrl: string): AuthEmailTemplate {
  const safeName = escapeHtml(name || "hola")
  const safeUrl = escapeHtml(resetUrl)

  return {
    subject: "Restablece tu contraseña de Cuentas Claras",
    htmlContent: `<main><h1>Restablece tu contraseña</h1><p>Hola, ${safeName}.</p><p>Usa este enlace para crear una nueva contraseña.</p><p><a href="${safeUrl}">Restablecer contraseña</a></p><p>Este enlace vence en una hora y solo puede usarse una vez.</p></main>`,
    textContent: `Hola, ${name || ""}. Restablece tu contraseña en Cuentas Claras: ${resetUrl}. El enlace vence en una hora y solo puede usarse una vez.`,
  }
}

/** Evita que el nombre de una persona altere el HTML del correo. */
function escapeHtml(value: string): string {
  return value.replace(/[&<>'"]/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      "'": "&#39;",
      '"': "&quot;",
    }
    return entities[character]
  })
}
