import { afterEach, describe, expect, it, vi } from "vitest";

import {
  getNotifications,
  getUnreadCount,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from "./notification-api";

describe("notification-api", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("getNotifications envía parámetros de paginación y cabecera Authorization", async () => {
    const mockData = {
      items: [
        {
          id: "act-1",
          event_id: "evt-1",
          actor_id: "carlos",
          actor_name: "Carlos",
          target_id: null,
          target_name: null,
          action_type: "expense.created",
          title: "Nuevo gasto registrado",
          description: "Gasto de prueba",
          target_path: "/events/evt-1",
          is_read: false,
          read_at: null,
          created_at: "2026-09-03T12:00:00Z",
        },
      ],
      unread_count: 1,
      total: 1,
    };

    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ token: "test-token" }), { status: 200 })
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify(mockData), { status: 200 })
      );

    const result = await getNotifications(10, 5, true);

    expect(fetchMock.mock.calls[0][0]).toBe("/api/auth/token");
    expect(fetchMock.mock.calls[1][0]).toBe(
      "http://localhost:8000/api/notifications?limit=10&offset=5&unread_only=true"
    );
    expect(result.unread_count).toBe(1);
    expect(result.items[0].id).toBe("act-1");
  });

  it("getUnreadCount obtiene el número de notificaciones no leídas", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ token: "test-token" }), { status: 200 })
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ unread_count: 5 }), { status: 200 })
      );

    const count = await getUnreadCount();

    expect(fetchMock.mock.calls[1][0]).toBe(
      "http://localhost:8000/api/notifications/unread-count"
    );
    expect(count).toBe(5);
  });

  it("markNotificationAsRead envía PATCH con el ID correspondiente", async () => {
    const mockItem = {
      id: "act-123",
      event_id: "evt-1",
      actor_id: "carlos",
      actor_name: "Carlos",
      target_id: null,
      target_name: null,
      action_type: "expense.created",
      title: "Nuevo gasto registrado",
      description: "Gasto",
      target_path: "/events/evt-1",
      is_read: true,
      read_at: "2026-09-03T12:05:00Z",
      created_at: "2026-09-03T12:00:00Z",
    };

    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ token: "test-token" }), { status: 200 })
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify(mockItem), { status: 200 })
      );

    const item = await markNotificationAsRead("act-123");

    expect(fetchMock.mock.calls[1][0]).toBe(
      "http://localhost:8000/api/notifications/act-123/read"
    );
    expect(fetchMock.mock.calls[1][1]?.method).toBe("PATCH");
    expect(item.is_read).toBe(true);
  });

  it("markAllNotificationsAsRead envía POST a /mark-all-read", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ token: "test-token" }), { status: 200 })
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ marked_count: 3, status: "ok" }), {
          status: 200,
        })
      );

    const res = await markAllNotificationsAsRead();

    expect(fetchMock.mock.calls[1][0]).toBe(
      "http://localhost:8000/api/notifications/mark-all-read"
    );
    expect(fetchMock.mock.calls[1][1]?.method).toBe("POST");
    expect(res.marked_count).toBe(3);
  });
});
