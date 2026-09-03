"use client";

import React from "react";
import {
  Calendar,
  Check,
  CheckCheck,
  CreditCard,
  Loader2,
  Receipt,
  UserPlus,
  BellOff,
} from "lucide-react";

import type { NotificationItem } from "../types/notification";
import { cn } from "@/lib/utils";

export interface NotificationsPopoverProps {
  items: NotificationItem[];
  isLoading: boolean;
  unreadCount: number;
  onMarkAsRead: (id: string, e?: React.MouseEvent) => void;
  onMarkAllAsRead: () => void;
  onItemClick: (item: NotificationItem) => void;
  isMarkingAll?: boolean;
}

function formatRelativeTime(dateString: string): string {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffSeconds < 60) return "hace un momento";
    const diffMinutes = Math.floor(diffSeconds / 60);
    if (diffMinutes < 60) return `hace ${diffMinutes}m`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `hace ${diffHours}h`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `hace ${diffDays}d`;
    return date.toLocaleDateString("es-BO", { day: "numeric", month: "short" });
  } catch {
    return "";
  }
}

function getActionIcon(actionType: string) {
  if (actionType.startsWith("expense.")) {
    return <Receipt className="size-4 text-emerald-400" />;
  }
  if (actionType.startsWith("payment.")) {
    return <CreditCard className="size-4 text-sky-400" />;
  }
  if (actionType.startsWith("member.")) {
    return <UserPlus className="size-4 text-purple-400" />;
  }
  return <Calendar className="size-4 text-amber-400" />;
}

export function NotificationsPopover({
  items,
  isLoading,
  unreadCount,
  onMarkAsRead,
  onMarkAllAsRead,
  onItemClick,
  isMarkingAll = false,
}: NotificationsPopoverProps) {
  return (
    <div className="w-[340px] sm:w-[380px] rounded-2xl border border-white/10 bg-[#161824] shadow-2xl overflow-hidden text-white">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-white/[0.02]">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-white">Notificaciones</h3>
          {unreadCount > 0 && (
            <span className="rounded-full bg-primary/20 text-primary px-2 py-0.5 text-[11px] font-bold">
              {unreadCount} nuevas
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            type="button"
            onClick={onMarkAllAsRead}
            disabled={isMarkingAll}
            className="flex items-center gap-1.5 text-xs text-[#bd7aff] hover:text-[#d3a6ff] transition-colors font-medium disabled:opacity-50"
            title="Marcar todas como leídas"
          >
            {isMarkingAll ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <CheckCheck className="size-3.5" />
            )}
            <span>Marcar todas</span>
          </button>
        )}
      </div>

      {/* Body List */}
      <div className="max-h-[380px] overflow-y-auto divide-y divide-white/5">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-10 gap-3 text-muted-foreground">
            <Loader2 className="size-6 animate-spin text-primary" />
            <span className="text-xs">Cargando notificaciones...</span>
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
            <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center mb-2.5 text-muted-foreground">
              <BellOff className="size-5" />
            </div>
            <p className="text-sm font-medium text-white">Sin notificaciones</p>
            <p className="text-xs text-muted-foreground mt-1 max-w-[240px]">
              Todas las novedades de tus eventos aparecerán aquí.
            </p>
          </div>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              role="button"
              tabIndex={0}
              onClick={() => onItemClick(item)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  onItemClick(item);
                }
              }}
              className={cn(
                "group flex items-start gap-3 p-3.5 transition-colors cursor-pointer hover:bg-white/[0.04]",
                !item.is_read ? "bg-primary/[0.06]" : "opacity-80 hover:opacity-100"
              )}
            >
              <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-xl bg-white/5">
                {getActionIcon(item.action_type)}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <p className="text-xs font-semibold text-white truncate">
                    {item.title}
                  </p>
                  <span className="text-[10px] text-muted-foreground shrink-0">
                    {formatRelativeTime(item.created_at)}
                  </span>
                </div>
                <p className="text-xs text-white/70 mt-0.5 line-clamp-2 leading-relaxed">
                  {item.description}
                </p>
              </div>

              <div className="shrink-0 flex items-center gap-1">
                {!item.is_read && (
                  <>
                    <button
                      type="button"
                      aria-label="Marcar como leída"
                      onClick={(e) => onMarkAsRead(item.id, e)}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded-md text-muted-foreground hover:text-white hover:bg-white/10 transition-all"
                      title="Marcar como leída"
                    >
                      <Check className="size-3.5" />
                    </button>
                    <span className="size-2 rounded-full bg-primary" />
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
