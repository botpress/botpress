import z from 'zod'

const HttpMethodSchema = z.union([
  z.literal('GET'),
  z.literal('POST'),
  z.literal('PUT'),
  z.literal('PATCH'),
  z.literal('DELETE'),
  z.literal('OPTIONS'),
  z.literal('HEAD'),
])

const linkSchema = z.object({
  rel: z.string().optional(),
  href: z.string().optional(),
  method: HttpMethodSchema.optional(),
  targetSchema: z.string().optional(),
  schema: z.string().optional(),
})

const tagsSchema = z.object({
  id: z.number().optional(),
  name: z.string().optional(),
})

const memberLastNoteSchema = z.object({
  note_id: z.number().optional(),
  created_at: z.string().optional(),
  created_by: z.string().optional(),
  note: z.string().optional(),
})

const memberMarketingPermissionsInputSchema = z.object({
  marketing_permission_id: z.string().optional(),
  enabled: z.boolean().optional(),
})

const memberMarketingPermissionsSchema =
  memberMarketingPermissionsInputSchema.extend({
    text: z.string().optional(),
  })

  const memberLocationSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
})

const fullMemberLocationSchema = memberLocationSchema.extend({
  gmtoff: z.number().optional(),
  dstoff: z.number().optional(),
  country_code: z.string().optional(),
  timezone: z.string().optional(),
  region: z.string().optional(),
})

const memberEcommerceDataSchema = z.object({
  total_revenue: z.number().optional(),
  number_of_orders: z.number().optional(),
  currency_code: z.number().optional(),
})

const memberStatsSchema = z.object({
  avg_open_rate: z.number().optional(),
  avg_click_rate: z.number().optional(),
  ecommerce_data: memberEcommerceDataSchema.optional(),
})

const batchStatusSchema = z.union([
  z.literal('pending'),
  z.literal('preprocessing'),
  z.literal('started'),
  z.literal('finalizing'),
  z.literal('finished'),
])

const contactSchema = z.object({
  company: z.string().describe('Company name'),
  address1: z.string().describe('Address line 1'),
  address2: z.string().describe('Address line 2'),
  city: z.string().describe('City'),
  state: z.string().describe('State'),
  zip: z.string().describe('ZIP code'),
  country: z.string().describe('Country'),
  phone: z.string().describe('Phone number'),
})

const campaignDefaultsSchema = z.object({
  from_name: z.string().describe('Default sender name'),
  from_email: z.string().email().describe('Default sender email'),
  subject: z.string().describe('Default email subject'),
  language: z.string().describe('Default email language'),
})

const statsSchema = z.object({
  member_count: z.number().describe('Member count'),
  unsubscribe_count: z.number().describe('Unsubscribe count'),
  cleaned_count: z.number().describe('Cleaned count'),
  member_count_since_send: z.number().describe('Member count since last send'),
  unsubscribe_count_since_send: z.number().describe('Unsubscribe count since last send'),
  cleaned_count_since_send: z.number().describe('Cleaned count since last send'),
  campaign_count: z.number().describe('Campaign count'),
  campaign_last_sent: z.string().describe('Last campaign sent date'),
  merge_field_count: z.number().describe('Merge field count'),
  avg_sub_rate: z.number().describe('Average subscription rate'),
  avg_unsub_rate: z.number().describe('Average unsubscribe rate'),
  target_sub_rate: z.number().describe('Target subscription rate'),
  open_rate: z.number().describe('Open rate'),
  click_rate: z.number().describe('Click rate'),
  last_sub_date: z.string().describe('Last subscription date'),
  last_unsub_date: z.string().describe('Last unsubscribe date'),
})

const listSchema = z.object({
  id: z.string(),
  web_id: z.number(),
  name: z.string(),
  contact: contactSchema,
  permission_reminder: z.string(),
  use_archive_bar: z.boolean(),
  campaign_defaults: campaignDefaultsSchema,
  notify_on_subscribe: z.string(),
  notify_on_unsubscribe: z.string(),
  date_created: z.string(),
  list_rating: z.number(),
  email_type_option: z.boolean(),
  subscribe_url_short: z.string(),
  subscribe_url_long: z.string(),
  beamer_address: z.string(),
  visibility: z.string(),
  double_optin: z.boolean(),
  has_welcome: z.boolean(),
  marketing_permissions: z.boolean(),
  modules: z.array(z.unknown()),
  stats: statsSchema,
  _links: z.array(linkSchema),
})

const constraintsSchema = z.object({
  may_create: z.boolean().describe('May create flag'),
  max_instances: z.number().describe('Maximum instances allowed'),
  current_total_instances: z.number().describe('Current total instances'),
})

export {
  HttpMethodSchema,
  linkSchema,
  tagsSchema,
  memberLastNoteSchema,
  memberMarketingPermissionsInputSchema,
  memberMarketingPermissionsSchema,
  memberLocationSchema,
  fullMemberLocationSchema,
  memberEcommerceDataSchema,
  memberStatsSchema,
  batchStatusSchema,
  constraintsSchema,
  listSchema,
}
