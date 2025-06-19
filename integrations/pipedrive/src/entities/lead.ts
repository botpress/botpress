import { z } from '@botpress/sdk'

const valueSchema = z.object({
  amount: z.number().default(0),
  currency: z.string().default('USD'),
})

const leadDataSchema = z.object({
  id: z.string().default(''),
  title: z.string().default(''),
  owner_id: z.number().default(0),
  creator_id: z.number().default(0),
  label_ids: z.array(z.string()).default([]),
  person_id: z.number().default(0),
  organization_id: z.null().optional().default(null),
  source_name: z.string().default(''),
  origin: z.string().default(''),
  origin_id: z.null().optional().default(null),
  channel: z.number().default(0),
  channel_id: z.string().default(''),
  is_archived: z.boolean().default(false),
  was_seen: z.boolean().default(false),
  value: valueSchema.default({
    amount: 0,
    currency: 'USD',
  }),
  expected_close_date: z.null().optional().default(null),
  next_activity_id: z.number().default(0),
  add_time: z.string().default(''),
  update_time: z.string().default(''),
  visible_to: z.string().default(''),
  cc_email: z.string().email().default('no-reply@example.com'),
})

export const pipedriveLeadResponseSchema = z.object({
  success: z.boolean().default(false),
  data: z.array(leadDataSchema).default([]),
})
