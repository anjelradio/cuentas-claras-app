import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import * as notifApi from "../services/notification-api";
import { NotificationsBell } from "./notifications-bell";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
  }),
}));

describe("NotificationsBell", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renderiza el botón de campana sin badge cuando no hay no leídas", async () => {
    vi.spyOn(notifApi, "getUnreadCount").mockResolvedValue(0);

    render(<NotificationsBell />);

    const button = await screen.findByRole("button", { name: /notificaciones/i });
    expect(button).toBeInTheDocument();
    expect(screen.queryByTestId("notifications-badge")).not.toBeInTheDocument();
  });

  it("muestra el badge con el conteo cuando hay alertas no leídas", async () => {
    vi.spyOn(notifApi, "getUnreadCount").mockResolvedValue(4);

    render(<NotificationsBell />);

    const badge = await screen.findByTestId("notifications-badge");
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent("4");
  });

  it("abre el popover y muestra las notificaciones al hacer clic", async () => {
    const user = userEvent.setup();
    vi.spyOn(notifApi, "getUnreadCount").mockResolvedValue(1);
    vi.spyOn(notifApi, "getNotifications").mockResolvedValue({
      items: [
        {
          id: "act-1",
          event_id: "evt-1",
          actor_id: "carlos",
          actor_name: "Carlos Ruiz",
          target_id: null,
          target_name: null,
          action_type: "expense.created",
          title: "Nuevo gasto registrado",
          description: "Carlos registró Almuerzo",
          target_path: "/events/evt-1",
          is_read: false,
          read_at: null,
          created_at: new Date().toISOString(),
        },
      ],
      unread_count: 1,
      total: 1,
    });

    render(<NotificationsBell />);

    const button = await screen.findByRole("button", { name: /notificaciones/i });
    await user.click(button);

    const title = await screen.findByText("Nuevo gasto registrado");
    expect(title).toBeInTheDocument();
    expect(screen.getByText("Carlos registró Almuerzo")).toBeInTheDocument();
  });

  it("permite marcar todas las notificaciones como leídas", async () => {
    const user = userEvent.setup();
    vi.spyOn(notifApi, "getUnreadCount").mockResolvedValue(2);
    vi.spyOn(notifApi, "getNotifications").mockResolvedValue({
      items: [
        {
          id: "act-1",
          event_id: "evt-1",
          actor_id: "carlos",
          actor_name: "Carlos",
          target_id: null,
          target_name: null,
          action_type: "expense.created",
          title: "Gasto 1",
          description: "Desc 1",
          target_path: "/events/evt-1",
          is_read: false,
          read_at: null,
          created_at: new Date().toISOString(),
        },
      ],
      unread_count: 2,
      total: 2,
    });
    const markAllSpy = vi
      .spyOn(notifApi, "markAllNotificationsAsRead")
      .mockResolvedValue({ marked_count: 2, status: "ok" });

    render(<NotificationsBell />);

    const button = await screen.findByRole("button", { name: /notificaciones/i });
    await user.click(button);

    const markAllBtn = await screen.findByRole("button", { name: /marcar todas/i });
    await user.click(markAllBtn);

    await waitFor(() => {
      expect(markAllSpy).toHaveBeenCalled();
    });
  });
});
