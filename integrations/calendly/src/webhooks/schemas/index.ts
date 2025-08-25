import { z } from '@botpress/sdk'
import { calendlyLocationSchema } from './locations'

const questionsAndAnswerSchema = z
  .object({
    question: z.string(),
    answer: z.string(),
    position: z.number(),
  })
  .passthrough()

const trackingSchema = z
  .object({
    utm_campaign: z.string().nullable(),
    utm_source: z.string().nullable(),
    utm_medium: z.string().nullable(),
    utm_content: z.string().nullable(),
    utm_term: z.string().nullable(),
    salesforce_uuid: z.string().nullable(),
  })
  .passthrough()

const cancellationSchema = z
  .object({
    canceled_by: z.string(),
    reason: z.string().nullable(),
    canceler_type: z.string(),
    created_at: z.coerce.date(),
  })
  .passthrough()

const paymentSchema = z
  .object({
    external_id: z.string(),
    provider: z.string(),
    amount: z.number().min(0),
    currency: z.string(),
    terms: z.string().nullable(),
    successful: z.boolean(),
  })
  .passthrough()

const eventMembershipSchema = z
  .object({
    user: z.string().url(),
    user_email: z.string().email(),
    user_name: z.string(),
  })
  .passthrough()

const inviteesCounterSchema = z
  .object({
    total: z.number(),
    active: z.number(),
    limit: z.number(),
  })
  .passthrough()

const eventGuestSchema = z
  .object({
    email: z.string().email(),
    created_at: z.coerce.date(),
    updated_at: z.coerce.date(),
  })
  .passthrough()

const scheduledEventSchema = z
  .object({
    uri: z.string().url(),
    name: z.string().nullable(),
    meeting_notes_plain: z.string().nullable().optional(),
    meeting_notes_html: z.string().nullable().optional(),
    status: z.string(),
    start_time: z.coerce.date(),
    end_time: z.coerce.date(),
    event_type: z.string().url(),
    location: calendlyLocationSchema,
    invitees_counter: inviteesCounterSchema,
    created_at: z.coerce.date(),
    updated_at: z.coerce.date(),
    event_memberships: z.array(eventMembershipSchema),
    event_guests: z.array(eventGuestSchema),
    cancellation: cancellationSchema.optional(),
  })
  .passthrough()

const inviteeEventPayloadSchema = z
  .object({
    uri: z.string().url(),
    email: z.string().email(),
    first_name: z.string().nullable(),
    last_name: z.string().nullable(),
    name: z.string(),
    status: z.string(),
    questions_and_answers: z.array(questionsAndAnswerSchema),
    timezone: z.string().nullable(),
    event: z.string().url(),
    created_at: z.coerce.date(),
    updated_at: z.coerce.date(),
    tracking: trackingSchema,
    text_reminder_number: z.string().nullable(),
    rescheduled: z.boolean(),
    old_invitee: z.string().url().nullable(),
    new_invitee: z.string().url().nullable(),
    cancel_url: z.string().url(),
    reschedule_url: z.string().url(),
    routing_form_submission: z.string().url().nullable(),
    cancellation: cancellationSchema.optional(),
    payment: paymentSchema.nullable(),
    no_show: z
      .object({
        uri: z.string().url(),
        created_at: z.coerce.date(),
      })
      .passthrough()
      .nullable(),
    reconfirmation: z
      .object({
        created_at: z.coerce.date(),
        confirmed_at: z.coerce.date().nullable(),
      })
      .passthrough()
      .nullable(),
    scheduling_method: z.string().nullable(),
    invitee_scheduled_by: z.string().nullable(),
    scheduled_event: scheduledEventSchema,
  })
  .passthrough()

export const inviteeEventSchema = z
  .object({
    event: z.union([
      z.literal('invitee.created'),
      z.literal('invitee.canceled'),
      z.literal('invitee_no_show.created'),
      z.literal('invitee_no_show.deleted'),
    ]),
    created_at: z.coerce.date(),
    created_by: z.string().url(),
    payload: inviteeEventPayloadSchema,
  })
  .passthrough()
export type InviteeEvent = z.infer<typeof inviteeEventSchema>
