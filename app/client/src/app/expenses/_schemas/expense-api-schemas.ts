import { z } from "zod";

export const errorSchema = z.object({
  code: z.string(),
  message: z.string(),
  details: z.unknown().optional().nullable(),
});

export const expenseCategoryEnum = z.enum([
  "food",
  "lodging",
  "transport",
  "shopping",
  "entertainment",
  "other",
]);

export const expenseSplitTypeEnum = z.enum(["equal", "exact"]);

export const expenseSplitRequestSchema = z.object({
  member_id: z.string(),
  assigned_amount: z.string().or(z.number()),
});

export const expenseCreateRequestSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional().nullable(),
  amount: z.string().or(z.number()),
  category: expenseCategoryEnum,
  split_type: expenseSplitTypeEnum,
  payer_participated: z.boolean(),
  expense_date: z.string(),
  participant_member_ids: z.array(z.string()).optional().nullable(),
  splits: z.array(expenseSplitRequestSchema).optional().nullable(),
  receipt_url: z.string().optional().nullable(),
});

export const receiptAnalysisResponseSchema = z.object({
  image_url: z.string(),
  receipt_public_id: z.string().nullable().optional(),
  is_receipt: z.boolean(),
  name: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  amount: z.string().or(z.number()).nullable().optional(),
  category: expenseCategoryEnum.nullable().optional(),
  expense_date: z.string().nullable().optional(),
});

export const expenseUpdateRequestSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional().nullable(),
  amount: z.string().or(z.number()).optional(),
  category: expenseCategoryEnum.optional(),
  split_type: expenseSplitTypeEnum.optional(),
  payer_participated: z.boolean().optional(),
  expense_date: z.string().optional(),
  participant_member_ids: z.array(z.string()).optional().nullable(),
  splits: z.array(expenseSplitRequestSchema).optional().nullable(),
});

export const expenseReadSchema = z.object({
  id: z.string(),
  event_id: z.string(),
  created_by_member_id: z.string(),
  paid_by_member_id: z.string(),
  name: z.string(),
  description: z.string().nullable().optional(),
  amount: z.string().or(z.number()),
  refund_amount: z.string().or(z.number()),
  payer_contribution: z.string().or(z.number()),
  payer_participated: z.boolean(),
  category: expenseCategoryEnum,
  split_type: expenseSplitTypeEnum,
  expense_date: z.string(),
  receipt_url: z.string().nullable().optional(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const expenseSplitReadSchema = z.object({
  id: z.string(),
  member_id: z.string(),
  member_name: z.string(),
  assigned_amount: z.string().or(z.number()),
  payment_status: z
    .enum(["no_payment", "pending_confirmation", "confirmed", "rejected"])
    .default("no_payment"),
  payment_id: z.string().nullable().optional(),
  payment_method: z.enum(["cash", "qr"]).nullable().optional(),
  proof_image_url: z.string().nullable().optional(),
});

export const expenseDetailSchema = z.object({
  id: z.string(),
  event_id: z.string(),
  name: z.string(),
  description: z.string().nullable().optional(),
  amount: z.string().or(z.number()),
  refund_amount: z.string().or(z.number()),
  payer_contribution: z.string().or(z.number()),
  payer_participated: z.boolean(),
  category: expenseCategoryEnum,
  split_type: expenseSplitTypeEnum,
  expense_date: z.string(),
  receipt_url: z.string().nullable().optional(),
  created_by_member_id: z.string(),
  created_by_member_name: z.string(),
  paid_by_member_id: z.string(),
  paid_by_member_name: z.string(),
  is_payer: z.boolean().default(false),
  current_user_split: expenseSplitReadSchema.nullable().optional(),
  created_at: z.string(),
  updated_at: z.string(),
  splits: z.array(expenseSplitReadSchema),
});

export const expenseSummarySchema = z.object({
  id: z.string(),
  event_id: z.string(),
  name: z.string(),
  description: z.string().nullable().optional(),
  amount: z.string().or(z.number()),
  refund_amount: z.string().or(z.number()),
  payer_contribution: z.string().or(z.number()),
  payer_participated: z.boolean(),
  category: expenseCategoryEnum,
  split_type: expenseSplitTypeEnum,
  expense_date: z.string(),
  paid_by_member_id: z.string(),
  paid_by_member_name: z.string(),
  has_receipt: z.boolean(),
  created_at: z.string(),
});

export const expenseReceiptSchema = z.object({
  expense_id: z.string(),
  receipt_url: z.string(),
});

export const debtToPayItemSchema = z.object({
  expense_id: z.string(),
  split_id: z.string(),
  expense_name: z.string(),
  category: expenseCategoryEnum,
  event_id: z.string(),
  event_name: z.string(),
  payer_name: z.string(),
  amount: z.string().or(z.number()),
  payment_status: z.string(),
  payment_id: z.string().nullable().optional(),
});

export const debtToCollectItemSchema = z.object({
  expense_id: z.string(),
  expense_name: z.string(),
  category: expenseCategoryEnum,
  event_id: z.string(),
  event_name: z.string(),
  total_pending_amount: z.string().or(z.number()),
  unpaid_count: z.number(),
  pending_verification_count: z.number(),
});

export const debtsSummarySchema = z.object({
  total_i_owe: z.string().or(z.number()),
  total_i_am_owed: z.string().or(z.number()),
  debts_to_pay: z.array(debtToPayItemSchema),
  debts_to_collect: z.array(debtToCollectItemSchema),
});

export const pendingVerificationPaymentSchema = z.object({
  payment_id: z.string(),
  split_id: z.string(),
  expense_id: z.string(),
  expense_name: z.string(),
  event_id: z.string(),
  event_name: z.string(),
  debtor_name: z.string(),
  amount: z.string().or(z.number()),
  payment_method: z.enum(["cash", "qr"]),
  created_at: z.string(),
});

export const recentEventSchema = z.object({
  id: z.string(),
  name: z.string(),
  icon: z.string(),
  status: z.enum(["open", "closed"]),
  member_count: z.number(),
  expense_count: z.number(),
  personal_spent_amount: z.string().or(z.number()),
  created_at: z.string(),
});

export const eventCategoryStatItemSchema = z.object({
  category: expenseCategoryEnum,
  label: z.string(),
  amount: z.string().or(z.number()),
  percentage: z.number(),
  count: z.number(),
});

export const eventStatisticsSchema = z.object({
  event_id: z.string(),
  total_amount: z.string().or(z.number()),
  currency: z.string().default("Bs."),
  categories: z.array(eventCategoryStatItemSchema),
});

