import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { ComponentCollectionShowcase } from "@/components/shared/component-collection-showcase";

describe("ComponentCollectionShowcase", () => {
  it("opens the example dialog from its keyboard-accessible trigger", async () => {
    const user = userEvent.setup();
    render(<ComponentCollectionShowcase />);
    await user.click(screen.getByRole("button", { name: "Abrir diálogo" }));
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
});
