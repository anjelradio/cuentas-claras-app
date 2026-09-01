import type { LucideIcon } from "lucide-react";
import { Car, Hotel, Package, ShoppingBasket, Ticket, Utensils } from "lucide-react";
import { z } from "zod";
import {
  debtToCollectItemSchema,
  debtToPayItemSchema,
  debtsSummarySchema,
  eventCategoryStatItemSchema,
  eventStatisticsSchema,
  expenseCategoryEnum,
  expenseCreateRequestSchema,
  expenseDetailSchema,
  expenseReadSchema,
  expenseReceiptSchema,
  expenseSplitReadSchema,
  expenseSplitRequestSchema,
  expenseSplitTypeEnum,
  expenseSummarySchema,
  expenseUpdateRequestSchema,
  pendingVerificationPaymentSchema,
  receiptAnalysisResponseSchema,
  recentEventSchema,
} from "../_schemas/expense-api-schemas";

export type ExpenseCategory = z.infer<typeof expenseCategoryEnum>;
export type ExpenseSplitType = z.infer<typeof expenseSplitTypeEnum>;

export type ExpenseSplitRequest = z.infer<typeof expenseSplitRequestSchema>;
export type ExpenseCreatePayload = z.infer<typeof expenseCreateRequestSchema>;
export type ExpenseUpdatePayload = z.infer<typeof expenseUpdateRequestSchema>;

export type ExpenseRead = z.infer<typeof expenseReadSchema>;
export type ExpenseSplit = z.infer<typeof expenseSplitReadSchema>;
export type ExpenseDetail = z.infer<typeof expenseDetailSchema>;
export type ExpenseSummary = z.infer<typeof expenseSummarySchema>;
export type ExpenseReceipt = z.infer<typeof expenseReceiptSchema>;
export type ReceiptAnalysisResponse = z.infer<typeof receiptAnalysisResponseSchema>;

export type DebtToPayItem = z.infer<typeof debtToPayItemSchema>;
export type DebtToCollectItem = z.infer<typeof debtToCollectItemSchema>;
export type DebtsSummary = z.infer<typeof debtsSummarySchema>;
export type PendingVerificationPayment = z.infer<typeof pendingVerificationPaymentSchema>;
export type RecentEvent = z.infer<typeof recentEventSchema>;
export type EventCategoryStatItem = z.infer<typeof eventCategoryStatItemSchema>;
export type EventStatistics = z.infer<typeof eventStatisticsSchema>;


export interface ExpenseCategoryMetadata {
  id: ExpenseCategory;
  label: string;
  emoji: string;
  icon: LucideIcon;
  accentClassName: string;
}

export const EXPENSE_CATEGORIES: ExpenseCategoryMetadata[] = [
  {
    id: "food",
    label: "Comida",
    emoji: "🍴",
    icon: Utensils,
    accentClassName: "bg-action-orange/15 text-action-orange",
  },
  {
    id: "lodging",
    label: "Hospedaje",
    emoji: "🏨",
    icon: Hotel,
    accentClassName: "bg-secondary/15 text-secondary",
  },
  {
    id: "transport",
    label: "Transporte",
    emoji: "🚗",
    icon: Car,
    accentClassName: "bg-tertiary/15 text-tertiary",
  },
  {
    id: "shopping",
    label: "Compras",
    emoji: "🛒",
    icon: ShoppingBasket,
    accentClassName: "bg-success/15 text-success",
  },
  {
    id: "entertainment",
    label: "Entretenimiento",
    emoji: "🎟️",
    icon: Ticket,
    accentClassName: "bg-primary/15 text-primary",
  },
  {
    id: "other",
    label: "Otra",
    emoji: "📦",
    icon: Package,
    accentClassName: "bg-muted-foreground/15 text-muted-foreground",
  },
];
