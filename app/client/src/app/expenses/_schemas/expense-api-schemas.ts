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
  paid_by_member_id: z.string(),
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
  paid_by_member_id: z.string().optional(),
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
});

export const expenseDetailSchema = z.object({
  id: z.string(),
  event_id: z.string(),
  name: z.string(),
  description: z.string().nullable().optional(),
  amount: z.string().or(z.number()),
  category: expenseCategoryEnum,
  split_type: expenseSplitTypeEnum,
  expense_date: z.string(),
  receipt_url: z.string().nullable().optional(),
  created_by_member_id: z.string(),
  created_by_member_name: z.string(),
  paid_by_member_id: z.string(),
  paid_by_member_name: z.string(),
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
