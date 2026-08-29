import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ComponentCollectionShowcase } from "@/components/shared/component-collection-showcase";

describe("base component accessibility", () => {
  it("provides names for the interactive controls and status text", () => {
    render(<ComponentCollectionShowcase />);
    expect(screen.getByRole("button", { name: "Mostrar Sonner" })).toBeInTheDocument();
    expect(screen.getByLabelText("Código de verificación")).toBeInTheDocument();
    expect(screen.getByText("Error: acción no completada")).toBeInTheDocument();
  });
});
