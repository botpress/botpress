import { z } from '@botpress/sdk'

export type Lead = z.infer<typeof leadSchema>
export const leadSchema = z
  .object({
    id: z.number().title('ID').describe('Unique identifier of the lead'),
    email: z.string().email().title('Email').describe('Email address of the lead'),
    first_name: z.string().nullable().title('First Name').describe('First name of the lead'),
    last_name: z.string().nullable().title('Last Name').describe('Last name of the lead'),
    position: z.string().nullable().title('Position').describe('Job position of the lead'),
    company: z.string().nullable().title('Company').describe('Company name of the lead'),
    company_industry: z.string().nullable().title('Company Industry').describe('Industry of the lead company'),
    company_size: z.string().nullable().title('Company Size').describe('Size of the lead company'),
    confidence_score: z
      .number()
      .min(0)
      .max(100)
      .nullable()
      .title('Confidence Score')
      .describe('Confidence score of the lead email'),
    website: z.string().nullable().title('Website').describe('Website URL of the lead'),
    country_code: z.string().nullable().title('Country Code').describe('Country code of the lead'),
    source: z.string().nullable().title('Source').describe('Source of the lead'),
    linkedin_url: z.string().nullable().title('LinkedIn URL').describe('LinkedIn profile URL of the lead'),
    phone_number: z.string().nullable().title('Phone Number').describe('Phone number of the lead'),
    twitter: z.string().nullable().title('Twitter').describe('Twitter handle of the lead'),
    sync_status: z.string().nullable().title('Sync Status').describe('Synchronization status of the lead'),
    notes: z.string().nullable().title('Notes').describe('Additional notes about the lead'),
    sending_status: z.string().nullable().title('Sending Status').describe('Email sending status of the lead'),
    last_activity_at: z.string().nullable().title('Last Activity At').describe('Last activity timestamp of the lead'),
    last_contacted_at: z
      .string()
      .nullable()
      .title('Last Contacted At')
      .describe('Last contacted timestamp of the lead'),
    verification: z
      .object({
        date: z.string().nullable().title('Date').describe('Verification date of the lead email'),
        status: z.string().nullable().title('Status').describe('Verification status of the lead email'),
      })
      .title('Verification')
      .describe('Email verification details'),
    leads_list: z
      .object({
        id: z.number().title('ID').describe('ID of the leads list'),
        name: z.string().title('Name').describe('Name of the leads list'),
        leads_count: z.number().title('Leads Count').describe('Number of leads in the list'),
      })
      .title('Leads List')
      .describe('Leads list information'),
    created_at: z.string().title('Created At').describe('Creation timestamp of the lead'),
  })
  .catchall(z.string().nullable())
  .title('Lead')
  .describe('Schema representing a lead in Hunter.io')

export type LeadPayload = z.infer<typeof leadPayloadSchema>
export const leadPayloadSchema = z
  .object({
    email: z.string().email().title('Email').describe('Email address of the lead'),
    first_name: z.string().optional().title('First Name').describe('First name of the lead'),
    last_name: z.string().optional().title('Last Name').describe('Last name of the lead'),
    position: z.string().optional().title('Position').describe('Job position of the lead'),
    company: z.string().optional().title('Company').describe('Company name of the lead'),
    company_industry: z.string().optional().title('Company Industry').describe('Industry of the lead company'),
    company_size: z.string().optional().title('Company Size').describe('Size of the lead company'),
    confidence_score: z
      .number()
      .min(0)
      .max(100)
      .optional()
      .title('Confidence Score')
      .describe('Confidence score of the lead email'),
    website: z.string().optional().title('Website').describe('Website URL of the lead'),
    country_code: z.string().optional().title('Country Code').describe('Country code of the lead'),
    source: z.string().optional().title('Source').describe('Source of the lead'),
    linkedin_url: z.string().optional().title('LinkedIn URL').describe('LinkedIn profile URL of the lead'),
    phone_number: z.string().optional().title('Phone Number').describe('Phone number of the lead'),
    twitter: z.string().optional().title('Twitter').describe('Twitter handle of the lead'),
    notes: z.string().optional().title('Notes').describe('Additional notes about the lead'),
    leads_list_id: z.number().optional().title('Leads List ID').describe('ID of the leads list'),
    leads_list_ids: z.array(z.number()).optional().title('Leads List IDs').describe('Array of leads list IDs'),
    custom_attributes: z
      .record(z.string())
      .optional()
      .title('Custom Attributes')
      .describe('Custom attributes for the lead'),
  })
  .title('Lead Payload')
  .describe('Schema for creating or updating a lead in Hunter.io')

export type SearchLeadsPayload = z.infer<typeof searchLeadsPayloadSchema>
export const searchLeadsPayloadSchema = z
  .object({
    leads_list_id: z.number().optional().title('Leads List ID').describe('Filter by leads list ID'),
    email: z.string().optional().title('Email').describe('Filter by email address'),
    first_name: z.string().optional().title('First Name').describe('Filter by first name'),
    last_name: z.string().optional().title('Last Name').describe('Filter by last name'),
    position: z.string().optional().title('Position').describe('Filter by job position'),
    company: z.string().optional().title('Company').describe('Filter by company name'),
    industry: z.string().optional().title('Industry').describe('Filter by company industry'),
    website: z.string().optional().title('Website').describe('Filter by website URL'),
    country_code: z.string().optional().title('Country Code').describe('Filter by country code'),
    company_size: z.string().optional().title('Company Size').describe('Filter by company size'),
    source: z.string().optional().title('Source').describe('Filter by lead source'),
    twitter: z.string().optional().title('Twitter').describe('Filter by Twitter handle'),
    linkedin_url: z.string().optional().title('LinkedIn URL').describe('Filter by LinkedIn URL'),
    phone_number: z.string().optional().title('Phone Number').describe('Filter by phone number'),
    sync_status: z
      .enum(['pending', 'error', 'success'])
      .optional()
      .title('Sync Status')
      .describe('Filter by synchronization status'),
    sending_status: z
      .array(z.enum(['clicked', 'opened', 'sent', 'pending', 'error', 'bounced', 'unsubscribed', 'replied', '~']))
      .optional()
      .title('Sending Status')
      .describe('Filter by email sending status'),
    verification_status: z
      .array(z.enum(['accept_all', 'disposable', 'invalid', 'unknown', 'valid', 'webmail', 'pending', '~']))
      .optional()
      .title('Verification Status')
      .describe('Filter by email verification status'),
    last_activity_at: z
      .enum(['*', '~'])
      .optional()
      .title('Last Activity At')
      .describe('Filter by last activity timestamp'),
    last_contacted_at: z
      .enum(['*', '~'])
      .optional()
      .title('Last Contacted At')
      .describe('Filter by last contacted timestamp'),
    custom_attributes: z
      .record(z.string())
      .optional()
      .title('Custom Attributes')
      .describe('Filter by custom attributes'),
    query: z.string().optional().title('Query').describe('Filter on first name, last name or email'),
    limit: z.number().min(1).max(1000).optional().title('Limit').describe('Maximum number of results to return'),
    offset: z.number().min(0).max(100000).optional().title('Offset').describe('Number of results to skip'),
  })
  .title('Search Leads Payload')
  .describe('Schema for searching leads in Hunter.io')
