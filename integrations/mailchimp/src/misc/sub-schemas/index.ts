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
  rel: z.string(),
  href: z.string(),
  method: HttpMethodSchema,
  targetSchema: z.string(),
  schema: z.string(),
})
const TagsSchema = z.object({
  id: z.number(),
  name: z.string(),
})
const MemberLastNoteSchema = z.object({
  note_id: z.number(),
  created_at: z.string(),
  created_by: z.string(),
  note: z.string(),
})
const MemberMarketingPermissionsInputSchema = z.object({
  marketing_permission_id: z.string(),
  enabled: z.boolean(),
})
const MemberMarketingPermissionsSchema =
  MemberMarketingPermissionsInputSchema.extend({
    text: z.string(),
  })
const MemberLocationSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
})
const FullMemberLocationSchema = MemberLocationSchema.extend({
  gmtoff: z.number(),
  dstoff: z.number(),
  country_code: z.string(),
  timezone: z.string(),
  region: z.string(),
})
const MemberEcommerceDataSchema = z.object({
  total_revenue: z.number(),
  number_of_orders: z.number(),
  currency_code: z.number(),
})
const MemberStatsSchema = z.object({
  avg_open_rate: z.number(),
  avg_click_rate: z.number(),
  ecommerce_data: MemberEcommerceDataSchema,
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
