import { z } from "zod"

export const eventStatusSchema = z.enum(["open", "closed"])
const eventFieldsSchema = z.object({
  id: z.string(), name: z.string(), description: z.string().nullable().optional(), icon: z.string(),
  starts_at: z.string(), ends_at: z.string(), status: eventStatusSchema,
})
export const eventSummarySchema = eventFieldsSchema.extend({ member_count: z.number().int().nonnegative() })
export const eventReadSchema = eventFieldsSchema.extend({
  user_id: z.string(), closed_at: z.string().nullable().optional(),
  created_at: z.string(), updated_at: z.string(),
})
export const eventDetailSchema = eventReadSchema.extend({
  user_id: z.string(), owner_name: z.string().nullable().optional(), is_owner: z.boolean(),
})
export const eventMemberSchema = z.object({
  user_id: z.string(), name: z.string(), email: z.string(), image: z.string().nullable().optional(),
  role: z.enum(["owner", "member"]), joined_at: z.string(),
})
export const myQrSchema = z.object({ image_url: z.string().url().nullable() })
export const operationSchema = z.object({ status: z.literal("ok") })
export const eventInvitationSchema = z.object({
  id: z.string(), event_id: z.string(), token_hash: z.string(), expires_at: z.string(),
})
export const errorSchema = z.object({ code: z.string(), message: z.string(), details: z.unknown().nullable().optional() })

export type EventSummary = z.infer<typeof eventSummarySchema>
export type EventRead = z.infer<typeof eventReadSchema>
export type EventDetail = z.infer<typeof eventDetailSchema>
export type EventMemberInfo = z.infer<typeof eventMemberSchema>
export type MyQr = z.infer<typeof myQrSchema>
