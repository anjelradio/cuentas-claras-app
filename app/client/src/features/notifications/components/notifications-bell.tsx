"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Bell } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import type { NotificationItem } from "../types/notification";
import {
  getNotifications,
  getUnreadCount,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from "../services/notification-api";
import { NotificationsPopover } from "./notifications-popover";

export function NotificationsBell() {
  const router = useRouter();
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isMarkingAll, setIsMarkingAll] = useState<boolean>(false);

  // Consulta el conteo de no leídas
  const fetchCount = useCallback(async () => {
    try {
      const count = await getUnreadCount();
      setUnreadCount(count);
    } catch {
      // Si falla la consulta en background, silenciar
    }
  }, []);

  // Carga la lista completa de notificaciones
  const loadNotifications = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getNotifications(20, 0, false);
      setItems(data.items);
      setUnreadCount(data.unread_count);
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : "No se pudieron cargar las notificaciones."
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Consultar conteo inicial y al recuperar el foco de la ventana
  useEffect(() => {
    fetchCount();
    const handleFocus = () => {
      fetchCount();
    };
    window.addEventListener("focus", handleFocus);
    const interval = setInterval(fetchCount, 45000); // Polling cada 45s

    return () => {
      window.removeEventListener("focus", handleFocus);
      clearInterval(interval);
    };
  }, [fetchCount]);

  // Al abrir el dropdown, cargar la lista
  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (open) {
      loadNotifications();
    }
  };

  const handleMarkAsRead = async (id: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    // Actualización optimista
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, is_read: true } : item))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));

    try {
      await markNotificationAsRead(id);
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : "Error al marcar la notificación como leída."
      );
      fetchCount();
    }
  };

  const handleMarkAllAsRead = async () => {
    setIsMarkingAll(true);
    // Actualización optimista
    setItems((prev) => prev.map((item) => ({ ...item, is_read: true })));
    setUnreadCount(0);

    try {
      await markAllNotificationsAsRead();
      toast.success("Todas las notificaciones marcadas como leídas.");
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : "Error al marcar todas las notificaciones como leídas."
      );
      fetchCount();
    } finally {
      setIsMarkingAll(false);
    }
  };

  const handleItemClick = (item: NotificationItem) => {
    if (!item.is_read) {
      handleMarkAsRead(item.id);
    }
    setIsOpen(false);
    router.push(item.target_path);
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            aria-label={`Notificaciones ${
              unreadCount > 0 ? `(${unreadCount} no leídas)` : ""
            }`}
            className="relative size-10 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            <Bell className="size-5" />
            {unreadCount > 0 && (
              <span
                data-testid="notifications-badge"
                className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-white shadow-lg ring-2 ring-[#12131c]"
              >
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </Button>
        }
      />
      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className="p-0 border-0 bg-transparent shadow-none"
      >
        <NotificationsPopover
          items={items}
          isLoading={isLoading}
          unreadCount={unreadCount}
          onMarkAsRead={handleMarkAsRead}
          onMarkAllAsRead={handleMarkAllAsRead}
          onItemClick={handleItemClick}
          isMarkingAll={isMarkingAll}
        />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
