import { z } from '@botpress/sdk'

import {
  linkSchema,
  tagsSchema,
  memberLastNoteSchema,
  memberMarketingPermissionsSchema,
  fullMemberLocationSchema,
  memberStatsSchema,
  batchStatusSchema,
  listSchema,
  constraintsSchema,
  recipientsSchema,
  settingsSchema,
  variateSettingsSchema,
  trackingSchema,
  rssOptsSchema,
  abSplitOptsSchema,
  socialCardSchema,
  reportSummarySchema,
  deliveryStatusSchema,
} from './sub-schemas'

export const customerSchema = z.object({
  email: z.string().email().describe('The email address of the customer (e.g. example@example.com)'),
  firstName: z.string().optional().describe('The first name of the customer (e.g. John)'),
  lastName: z.string().optional().describe('The last name of the customer (e.g. Doe)'),
  company: z.string().optional().describe('The company of the customer (e.g. Acme Inc.)'),
  birthday: z.string().optional().describe('The birthday of the customer (e.g. 01/01/2000)'),
  language: z.string().optional().describe('The language of the customer (e.g. en)'),
  address1: z.string().optional().describe('The first line of the address of the customer (e.g. 123 St Marie.)'),
  address2: z.string().optional().describe('The second line of the address of the customer (e.g. Apt. 4B)'),
  city: z.string().optional().describe('The city of the customer (e.g. Anytown)'),
  state: z.string().optional().describe('The state or province of the customer (e.g. CA)'),
  zip: z.string().optional().describe('The zip or postal code of the customer (e.g. 12345)'),
  country: z.string().optional().describe('The country of the customer (e.g. USA)'),
  phone: z.string().optional().describe('The phone number of the customer (e.g. 555-1234)'),
})

export const addCustomerToCampaignInputSchema = customerSchema.extend({
  campaignId: z.string().describe('The ID of the Mailchimp campaign (e.g. f6g7h8i9j0)'),
})

export const addCustomerToListInputSchema = customerSchema.extend({
  listId: z.string().describe('The ID of the Mailchimp list or audience (e.g. a1b2c3d4e5)'),
})

export const sendMassEmailCampaignInputSchema = z.object({
  campaignIds: z.string().describe('The Campaign IDs (Can be either a string with comma-separated IDs)'),
})

export const addCustomerOutputSchema = z.object({
  id: z.string(),
  email_address: z.string(),
  status: z.string(),
  list_id: z.string(),
})

export const addCustomerFullOutputSchema = z.object({
  id: z.string().optional(),
  email_address: z.string().optional(),
  unique_email_id: z.string().optional(),
  contact_id: z.string().optional(),
  full_name: z.string().optional(),
  web_id: z.number().optional(),
  email_type: z.string().optional(),
  status: z.string().optional(),
  unsubscribe_reason: z.string().optional(),
  consents_to_one_to_one_messaging: z.boolean().optional(),
  merge_fields: z.record(z.any()).optional(),
  interests: z.record(z.any()).optional(),
  stats: memberStatsSchema.optional(),
  ip_signup: z.string().optional(),
  timestamp_signup: z.string().optional(),
  ip_opt: z.string().optional(),
  timestamp_opt: z.string().optional(),
  member_rating: z.union([z.number(), z.string()]).optional(),
  last_changed: z.string().optional(),
  language: z.string().optional(),
  vip: z.boolean().optional(),
  email_client: z.string().optional(),
  location: fullMemberLocationSchema.optional(),
  marketing_permissions: z.array(memberMarketingPermissionsSchema).optional(),
  last_note: memberLastNoteSchema.optional(),
  source: z.string().optional(),
  tags_count: z.number().optional(),
  tags: z.array(tagsSchema).optional(),
  list_id: z.string().optional(),
  _links: z.array(linkSchema).optional(),
  message: z.string().optional(),
})

export const sendMassEmailCampaignOutputSchema = z.object({
  id: z.string().optional(),
  status: batchStatusSchema.optional(),
  total_operations: z.number().optional(),
  _links: z.array(linkSchema).optional(),
})

export const sendMassEmailCampaignFullOutputSchema = z.object({
  id: z.string(),
  status: batchStatusSchema,
  total_operations: z.number(),
  finished_operations: z.number(),
  errored_operations: z.number(),
  submitted_at: z.string(),
  completed_at: z.string(),
  response_body_url: z.string(),
  _links: z.array(linkSchema),
})

export const getAllListsOutputSchema = z.object({
  lists: z.array(listSchema),
  constraints: constraintsSchema,
  _links: z.array(linkSchema),
})

export const getAllListsInputSchema = z.object({
  count: z.number().optional().default(100),
})

export const getAllCampaignsInputSchema = getAllListsInputSchema

const campaignSchema = z.object({
  id: z.string(),
  web_id: z.number(),
  parent_campaign_id: z.string().optional(),
  type: z.string(),
  create_time: z.string(),
  archive_url: z.string(),
  long_archive_url: z.string(),
  status: z.string(),
  emails_sent: z.number(),
  send_time: z.string(),
  content_type: z.string(),
  needs_block_refresh: z.boolean(),
  resendable: z.boolean(),
  recipients: recipientsSchema.optional(),
  settings: settingsSchema,
  variate_settings: variateSettingsSchema.optional(),
  tracking: trackingSchema,
  rss_opts: rssOptsSchema.optional(),
  ab_split_opts: abSplitOptsSchema.optional(),
  social_card: socialCardSchema.optional(),
  report_summary: reportSummarySchema.optional(),
  delivery_status: deliveryStatusSchema,
  _links: z.array(linkSchema),
})

export const getAllCampaignsOutputSchema = z.object({
  campaigns: z.array(campaignSchema),
  total_items: z.number().describe('Total number of items'),
  _links: z.array(linkSchema),
})
