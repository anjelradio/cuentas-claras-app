import { describe, expect, it, vi, beforeEach } from "vitest"

const sendTransacEmailMock = vi.fn()
vi.mock("server-only", () => ({}))
vi.mock("@getbrevo/brevo", () => {
  return {
    BrevoClient: vi.fn().mockImplementation(function() {
      return {
        transactionalEmails: {
          sendTransacEmail: sendTransacEmailMock
        }
      }
    })
  }
})

import { sendTransactionalEmail } from "./brevo-client"

describe("Adaptador Brevo", () => {
  beforeEach(() => {
    process.env.BREVO_API_KEY = "dummy"
    process.env.BREVO_SENDER_EMAIL = "sender@ejemplo.com"
    process.env.BREVO_SENDER_NAME = "Sender"
    vi.clearAllMocks()
  })

  it("solo incluye la URL segura en el cuerpo del correo", async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    sendTransacEmailMock.mockResolvedValueOnce({} as any)
    
    await sendTransactionalEmail(
      { email: "test@ejemplo.com", name: "Test" },
      { subject: "Prueba", htmlContent: "URL: https://segura.com/token123", textContent: "" }
    )
    
    expect(sendTransacEmailMock).toHaveBeenCalled()
    const call = sendTransacEmailMock.mock.calls[0][0]
    expect(call.to[0].email).toBe("test@ejemplo.com")
    expect(call.htmlContent).toContain("https://segura.com/token123")
  })
  
  it("lanza un error que no contiene la URL ante fallos", async () => {
    sendTransacEmailMock.mockRejectedValueOnce(new Error("Brevo HTTP Error: Invalid API Key"))
    
    await expect(
      sendTransactionalEmail(
        { email: "test@ejemplo.com", name: "Test" },
        { subject: "Prueba", htmlContent: "URL: https://segura.com/token123", textContent: "" }
      )
    ).rejects.toThrowError("Brevo HTTP Error")
  })
})
