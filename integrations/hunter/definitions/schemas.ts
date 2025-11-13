import { z } from '@botpress/sdk'

export type Lead = z.infer<typeof leadSchema>
export const leadSchema = z
  .object({
    id: z.number(),
    email: z.string().email(),
    first_name: z.string().nullable(),
    last_name: z.string().nullable(),
    position: z.string().nullable(),
    company: z.string().nullable(),
    company_industry: z.string().nullable(),
    company_size: z.string().nullable(),
    confidence_score: z.number().min(0).max(100).nullable(),
    website: z.string().nullable(),
    country_code: z.string().nullable(),
    source: z.string().nullable(),
    linkedin_url: z.string().nullable(),
    phone_number: z.string().nullable(),
    twitter: z.string().nullable(),
    sync_status: z.string().nullable(),
    notes: z.string().nullable(),
    sending_status: z.string().nullable(),
    last_activity_at: z.string().nullable(),
    last_contacted_at: z.string().nullable(),
    verification: z.object({
      date: z.string().nullable(),
      status: z.string().nullable(),
    }),
    leads_list: z.object({
      id: z.number(),
      name: z.string(),
      leads_count: z.number(),
    }),
    created_at: z.string(),
  })
  .catchall(z.string().nullable())
  .title('Lead')
  .describe('Schema representing a lead in Hunter.io')

export type LeadPayload = z.infer<typeof leadPayloadSchema>
export const leadPayloadSchema = z
  .object({
    email: z.string().email(),
    first_name: z.string().optional(),
    last_name: z.string().optional(),
    position: z.string().optional(),
    company: z.string().optional(),
    company_industry: z.string().optional(),
    company_size: z.string().optional(),
    confidence_score: z.number().min(0).max(100).optional(),
    website: z.string().optional(),
    country_code: z.string().optional(),
    source: z.string().optional(),
    linkedin_url: z.string().optional(),
    phone_number: z.string().optional(),
    twitter: z.string().optional(),
    notes: z.string().optional(),
    leads_list_id: z.number().optional(),
    leads_list_ids: z.array(z.number()).optional(),
    custom_attributes: z.record(z.string()).optional(),
  })
  .title('Lead Payload')
  .describe('Schema for creating or updating a lead in Hunter.io')

export type SearchLeadsPayload = z.infer<typeof searchLeadsPayloadSchema>
export const searchLeadsPayloadSchema = z
  .object({
    leads_list_id: z.number().optional(),
    email: z.string().optional(),
    first_name: z.string().optional(),
    last_name: z.string().optional(),
    position: z.string().optional(),
    company: z.string().optional(),
    industry: z.string().optional(),
    website: z.string().optional(),
    country_code: z.string().optional(),
    company_size: z.string().optional(),
    source: z.string().optional(),
    twitter: z.string().optional(),
    linkedin_url: z.string().optional(),
    phone_number: z.string().optional(),
    sync_status: z.enum(['pending', 'error', 'success']).optional(),
    sending_status: z
      .array(z.enum(['clicked', 'opened', 'sent', 'pending', 'error', 'bounced', 'unsubscribed', 'replied', '~']))
      .optional(),
    verification_status: z
      .array(z.enum(['accept_all', 'disposable', 'invalid', 'unknown', 'valid', 'webmail', 'pending', '~']))
      .optional(),
    last_activity_at: z.enum(['*', '~']).optional(),
    last_contacted_at: z.enum(['*', '~']).optional(),
    custom_attributes: z.record(z.string()).optional(),
    query: z.string().optional().describe('Filter on first name, last name or email'),
    limit: z.number().min(1).max(1000).optional(),
    offset: z.number().min(0).max(100000).optional(),
  })
  .title('Search Leads Payload')
  .describe('Schema for searching leads in Hunter.io')
