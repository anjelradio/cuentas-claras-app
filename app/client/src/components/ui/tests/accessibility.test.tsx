import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { ComponentCollectionShowcase } from "@/components/shared/component-collection-showcase";

describe("base component accessibility", () => {
  it("provides names for the interactive controls and status text", async () => {
    const user = userEvent.setup();
    render(<ComponentCollectionShowcase />);
    expect(screen.getByRole("button", { name: "Mostrar Sonner" })).toBeInTheDocument();
    expect(screen.getByLabelText("Código de verificación")).toBeInTheDocument();
    expect(screen.getByText("Error: acción no completada")).toBeInTheDocument();
    const select = screen.getByRole("combobox", { name: "Frecuencia" });
    select.focus();
    await user.keyboard("[Enter]");
    expect(await screen.findByRole("option", { name: "Semanal" })).toBeInTheDocument();
  });
});
