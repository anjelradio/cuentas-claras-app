import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { ComponentCollectionShowcase } from "@/components/shared/component-collection-showcase";
import { Toaster } from "@/components/ui/sonner";

describe("ComponentCollectionShowcase", () => {
  it("opens the example dialog from its keyboard-accessible trigger", async () => {
    const user = userEvent.setup();
    render(<ComponentCollectionShowcase />);
    const trigger = screen.getByRole("button", { name: "Abrir diálogo" });
    trigger.focus();
    await user.keyboard("[Enter]");
    expect(await screen.findByRole("heading", { name: "Diálogo de ejemplo" })).toBeInTheDocument();
  });

  it("exposes the remaining interactive component examples and the Sonner action", async () => {
    const user = userEvent.setup();
    render(<ComponentCollectionShowcase />);
    expect(screen.getByRole("checkbox", { name: "Aceptar las condiciones" })).toBeInTheDocument();
    expect(screen.getByLabelText("Código de verificación")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Abrir confirmación" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Abrir panel" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Mostrar Sonner" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Abrir confirmación" }));
    expect(await screen.findByRole("heading", { name: "¿Confirmar acción?" })).toBeInTheDocument();
  });

  it("supports keyboard activation and state feedback for the controls", async () => {
    const user = userEvent.setup();
    render(<ComponentCollectionShowcase />);

    const checkbox = screen.getByRole("checkbox", { name: "Aceptar las condiciones" });
    checkbox.focus();
    await user.keyboard("[Space]");
    expect(checkbox).toHaveAttribute("aria-checked", "true");

    const otp = screen.getByLabelText("Código de verificación");
    otp.focus();
    await user.keyboard("123456");
    expect(otp).toHaveValue("123456");

    const sheetTrigger = screen.getByRole("button", { name: "Abrir panel" });
    sheetTrigger.focus();
    await user.keyboard("[Enter]");
    expect(await screen.findByRole("heading", { name: "Panel lateral" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Close" }));

  });

  it("announces a Sonner notification from a keyboard activation", async () => {
    const user = userEvent.setup();
    render(<><ComponentCollectionShowcase /><Toaster /></>);
    const sonnerTrigger = screen.getByRole("button", { name: "Mostrar Sonner" });
    sonnerTrigger.focus();
    await user.keyboard("[Enter]");
    expect(await screen.findByText("Notificación de ejemplo enviada")).toBeInTheDocument();
  });
});
