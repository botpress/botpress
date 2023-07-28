import * as z from 'zod'

import {
  LinkSchema,
  TagsSchema,
  MemberLastNoteSchema,
  MemberMarketingPermissionsSchema,
  FullMemberLocationSchema,
  MemberStatsSchema,
  BatchStatusSchema,
} from './sub-schemas'

export const customerSchema = z.object({
  email: z
    .string()
    .email()
    .describe('The email address of the customer (e.g. example@example.com)'),
  firstName: z
    .string()
    .optional()
    .describe('The first name of the customer (e.g. John)'),
  lastName: z
    .string()
    .optional()
    .describe('The last name of the customer (e.g. Doe)'),
  company: z
    .string()
    .optional()
    .describe('The company of the customer (e.g. Acme Inc.)'),
  birthday: z
    .string()
    .optional()
    .describe('The birthday of the customer (e.g. 01/01/2000)'),
  language: z
    .string()
    .optional()
    .describe('The language of the customer (e.g. en)'),
  address1: z
    .string()
    .optional()
    .describe(
      'The first line of the address of the customer (e.g. 123 St Marie.)'
    ),
  address2: z
    .string()
    .optional()
    .describe('The second line of the address of the customer (e.g. Apt. 4B)'),
  city: z
    .string()
    .optional()
    .describe('The city of the customer (e.g. Anytown)'),
  state: z
    .string()
    .optional()
    .describe('The state or province of the customer (e.g. CA)'),
  zip: z
    .string()
    .optional()
    .describe('The zip or postal code of the customer (e.g. 12345)'),
  country: z
    .string()
    .optional()
    .describe('The country of the customer (e.g. USA)'),
  phone: z
    .string()
    .optional()
    .describe('The phone number of the customer (e.g. 555-1234)'),
})

export const addCustomerToCampaignInputSchema = customerSchema.extend({
  campaignId: z
    .string()
    .describe('The ID of the Mailchimp campaign (e.g. f6g7h8i9j0)'),
})

export const addCustomerToListInputSchema = customerSchema.extend({
  listId: z
    .string()
    .describe('The ID of the Mailchimp list or audience (e.g. a1b2c3d4e5)'),
})

export const sendMassEmailCampaignInputSchema = z.object({
  campaignIds: z
    .union([z.string(), z.array(z.string())])
    .describe(
      'The Campaign IDs (Can be either a string with comma-separated IDs)'
    ),
})

export const addCustomerOutputSchema = z.object({
  id: z.string(),
  email_address: z.string(),
  unique_email_id: z.string(),
  contact_id: z.string(),
  full_name: z.string(),
  web_id: z.number(),
  email_type: z.string(),
  status: z.string(),
  unsubscribe_reason: z.string(),
  consents_to_one_to_one_messaging: z.boolean(),
  merge_fields: z.record(z.any()),
  interests: z.record(z.any()),
  stats: MemberStatsSchema,
  ip_signup: z.string(),
  timestamp_signup: z.string(),
  ip_opt: z.string(),
  timestamp_opt: z.string(),
  member_rating: z.string(),
  last_changed: z.string(),
  language: z.string(),
  vip: z.boolean(),
  email_client: z.string(),
  location: FullMemberLocationSchema,
  marketing_permissions: z.array(MemberMarketingPermissionsSchema),
  last_note: MemberLastNoteSchema,
  source: z.string(),
  tags_count: z.number(),
  tags: z.array(TagsSchema),
  list_id: z.string(),
  _links: z.array(LinkSchema),
})

export const sendMassEmailCampaignOutputSchema = z.object({
  id: z.string(),
  status: BatchStatusSchema,
  total_operations: z.number(),
  finished_operations: z.number(),
  errored_operations: z.number(),
  submitted_at: z.string(),
  completed_at: z.string(),
  response_body_url: z.string(),
  _links: z.array(LinkSchema),
})
