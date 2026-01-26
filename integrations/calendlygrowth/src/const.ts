import { z } from '@botpress/sdk'

export const organizationIdTag = `organizationIdTag` as const
export const userIdTag = `userIdTag` as const

interface Profile {
  type: string
  name: string
  owner: string
}

interface Location {
  kind: string
  phone_number?: number
  additional_info: string
}

interface CustomQuestion {
  name: string
  type: string
  position: number
  enabled: boolean
  required: boolean
  answer_choices: string[]
  include_other: boolean
}
interface EventType {
  uri: string
  name: string | null
  active: boolean
  booking_method: string
  slug: string | null
  scheduling_url: string
  duration: number
  kind: string
  pooling_type: string | null
  type: string
  color: string
  created_at: string
  updated_at: string
  internal_note: string | null
  description_plain: string | null
  description_html: string | null
  profile?: Profile
  secret: boolean
  deleted_at: string | null
  admin_managed: boolean
  locations?: Location[]
  position: number
  custom_questions: CustomQuestion[]
}

interface Pagination {
  count: number
  next_page: string | null 
  previous_page: string | null 
  next_page_token: string | null 
  previous_page_token: string | null 
}

export interface CalendlyData {
  collection: EventType[]
  pagination: Pagination
}


const questionAndAnswerSchema = z.object({
  question: z.string(),
  answer: z.string(),
  position: z.number()
})

const eventMembershipSchema = z.object({
  user: z.string().url(),
  user_email: z.string().email(),
  user_name: z.string()
})

const inviteesCounterSchema = z.object({
  total: z.number(),
  active: z.number(),
  limit: z.number()
})

const locationSchema = z.object({
  location: z.string().nullish(),
  type: z.string().optional()
})

const scheduledEventSchema = z.object({
  created_at: z.string(),
  end_time: z.string(),
  event_guests: z.array(z.string()),
  event_memberships: z.array(eventMembershipSchema),
  event_type: z.string().url(),
  invitees_counter: inviteesCounterSchema,
  location: locationSchema,
  meeting_notes_html: z.string().nullable(),
  meeting_notes_plain: z.string().nullable(),
  name: z.string(),
  start_time: z.string(),
  status: z.string(),
  updated_at: z.string(),
  uri: z.string().url()
})

const trackingSchema = z.object({
  utm_campaign: z.string().nullable(),
  utm_source: z.string(),
  utm_medium: z.string().nullable(),
  utm_content: z.string().nullable(),
  utm_term: z.string().nullable(),
  salesforce_uuid: z.string().nullable()
})

export const payloadSchema = z.object({
  cancel_url: z.string().url().optional(),
  created_at: z.string(),
  email: z.string().email(),
  event: z.string().url(),
  first_name: z.string().nullable().optional(),
  invitee_scheduled_by: z.string().url().optional(),
  last_name: z.string().nullable().optional(),
  name: z.string().optional(),
  new_invitee: z.string().url().nullable(),
  no_show: z.any().nullable(),
  old_invitee: z.string().url().nullable(),
  payment: z.any().nullable(),
  questions_and_answers: z.array(questionAndAnswerSchema),
  reconfirmation: z.any().nullable(),
  reschedule_url: z.string().url(),
  rescheduled: z.boolean(),
  routing_form_submission: z.string().url().nullable(),
  scheduled_event: scheduledEventSchema,
  scheduling_method: z.string().nullable(),
  status: z.string(),
  text_reminder_number: z.string().nullable(),
  timezone: z.string(),
  tracking: trackingSchema,
  updated_at: z.string(),
  uri: z.string().url()
})

export const calendlyWebhookEventSchema = z.object({
  created_at: z.string(),
  created_by: z.string().url(),
  event: z.string(),
  payload: payloadSchema
})

export interface WebhookSubscription {
  uri: string
  callback_url: string
  created_at: string
  updated_at: string;                
  retry_started_at: string | null
  state: 'active' | 'disabled'
  events: string[]
  scope: 'user' | 'organization'
  organization: string     
  user: string | null       
  creator: string | null       
}

interface Pagination {
  count: number;
  next_page: string | null;
  previous_page: string | null; 
  next_page_token: string | null; 
  previous_page_token: string | null;
}

export interface WebhookSubscriptionData {
  collection: WebhookSubscription[];
  pagination: Pagination;
}

export const calendlyErrorSchema = z.object({
  title: z.string(),
  message: z.string(),
  details: z.array(z.object({
    parameter: z.string().optional(),
    message: z.string()
  })).optional()
}).passthrough()
