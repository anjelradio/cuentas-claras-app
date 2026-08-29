import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { DesignSystemShowcase } from "@/components/shared/design-system-showcase";

describe("DesignSystemShowcase", () => {
  it("presents the approved design tokens and typographic roles", () => {
    render(<DesignSystemShowcase />);
    expect(screen.getByRole("heading", { name: "Tokens y tipografía" })).toBeInTheDocument();
    expect(screen.getByText("Primary")).toBeInTheDocument();
    expect(screen.getByText("Roles tipográficos")).toBeInTheDocument();
  });
});
