import * as z from 'zod'

const HttpMethodSchema = z.union([
  z.literal('GET'),
  z.literal('POST'),
  z.literal('PUT'),
  z.literal('PATCH'),
  z.literal('DELETE'),
  z.literal('OPTIONS'),
  z.literal('HEAD'),
])
const LinkSchema = z.object({
  rel: z.string().optional(),
  href: z.string().optional(),
  method: HttpMethodSchema.optional(),
  targetSchema: z.string().optional(),
  schema: z.string().optional(),
})
const TagsSchema = z.object({
  id: z.number().optional(),
  name: z.string().optional(),
})
const MemberLastNoteSchema = z.object({
  note_id: z.number().optional(),
  created_at: z.string().optional(),
  created_by: z.string().optional(),
  note: z.string().optional(),
})
const MemberMarketingPermissionsInputSchema = z.object({
  marketing_permission_id: z.string().optional(),
  enabled: z.boolean().optional(),
})
const MemberMarketingPermissionsSchema =
  MemberMarketingPermissionsInputSchema.extend({
    text: z.string().optional(),
  })
const MemberLocationSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
})
const FullMemberLocationSchema = MemberLocationSchema.extend({
  gmtoff: z.number().optional(),
  dstoff: z.number().optional(),
  country_code: z.string().optional(),
  timezone: z.string().optional(),
  region: z.string().optional(),
})
const MemberEcommerceDataSchema = z.object({
  total_revenue: z.number().optional(),
  number_of_orders: z.number().optional(),
  currency_code: z.number().optional(),
})
const MemberStatsSchema = z.object({
  avg_open_rate: z.number().optional(),
  avg_click_rate: z.number().optional(),
  ecommerce_data: MemberEcommerceDataSchema.optional(),
})
const BatchStatusSchema = z.union([
  z.literal('pending'),
  z.literal('preprocessing'),
  z.literal('started'),
  z.literal('finalizing'),
  z.literal('finished'),
])

export {
  HttpMethodSchema,
  LinkSchema,
  TagsSchema,
  MemberLastNoteSchema,
  MemberMarketingPermissionsInputSchema,
  MemberMarketingPermissionsSchema,
  MemberLocationSchema,
  FullMemberLocationSchema,
  MemberEcommerceDataSchema,
  MemberStatsSchema,
  BatchStatusSchema,
}
