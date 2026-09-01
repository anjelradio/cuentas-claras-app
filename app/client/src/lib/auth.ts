import "server-only"
import { after } from "next/server"
import { betterAuth } from "better-auth"
import { APIError, createAuthMiddleware } from "better-auth/api"
import { jwt } from "better-auth/plugins"
import { Pool } from "pg"

import { sendResetPasswordEmail, sendVerificationEmail } from "@/lib/email/auth-email"

const jwtAudience = process.env.AUTH_JWT_AUDIENCE?.trim()

/**
 * Fuente de verdad de cuentas, sesiones y credenciales del cliente web.
 * Las migraciones estándar de Better Auth y JWKS se ejecutan externamente.
 */
export const auth = betterAuth({
  database: new Pool({ connectionString: process.env.DATABASE_URL }),
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL,
  trustedOrigins: [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://192.168.1.19:3000",
    ...(process.env.BETTER_AUTH_URL ? [process.env.BETTER_AUTH_URL] : []),
  ],
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    autoSignIn: false,
    minPasswordLength: 12,
    resetPasswordTokenExpiresIn: 60 * 60,
    revokeSessionsOnPasswordReset: true,
    sendResetPassword: async ({ user, url }) => {
      after(() => {
        sendResetPasswordEmail({ email: user.email, name: user.name, url }).catch((error) => {
          console.error("Failed to send reset password email in background:", error)
        })
      })
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    sendOnSignIn: true,
    autoSignInAfterVerification: true,
    expiresIn: 60 * 60,
    sendVerificationEmail: async ({ user, url }) => {
      after(() => {
        sendVerificationEmail({ email: user.email, name: user.name, url }).catch((error) => {
          console.error("Failed to send verification email in background:", error)
        })
      })
    },
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
  },
  account: {
    accountLinking: {
      // Un correo coincidente no basta para vincular Google a una cuenta existente.
      disableImplicitLinking: true,
    },
  },
  hooks: {
    before: createAuthMiddleware(async (context) => {
      if (context.path !== "/sign-up/email" && context.path !== "/reset-password") {
        return
      }

      const body = context.body as { name?: unknown; password?: unknown; newPassword?: unknown }
      const password = body.password ?? body.newPassword
      if (typeof password !== "string" || !isValidPassword(password)) {
        throw new APIError("BAD_REQUEST", { message: "INVALID_PASSWORD" })
      }

      if (context.path === "/sign-up/email" && (typeof body.name !== "string" || !body.name.trim())) {
        throw new APIError("BAD_REQUEST", { message: "INVALID_NAME" })
      }
    }),
  },
  plugins: [
    jwt({
      jwt: {
        issuer: process.env.BETTER_AUTH_URL,
        ...(jwtAudience ? { audience: jwtAudience } : {}),
        expirationTime: process.env.AUTH_JWT_EXPIRATION || "15m",
        getSubject: ({ user }) => user.id,
      },
    }),
  ],
  rateLimit: {
    window: 60, // 1 minuto
    max: 10,
    customRules: {
      "/forget-password": { window: 60 * 60, max: 3 }, // max 3 requestPasswordReset per hour per IP
      "/send-verification-email": { window: 60 * 60, max: 3 }, // max 3 per hour
    },
  },
})

/** Aplica la política de contraseña también en el límite de seguridad. */
function isValidPassword(password: string): boolean {
  return password.length >= 12 && /[A-Za-z]/.test(password) && /\d/.test(password)
}
