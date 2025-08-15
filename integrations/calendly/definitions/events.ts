import { z } from '@botpress/sdk'
import { calendlyUri, nonBlankString } from './common'

export const questionsAndAnswerSchema = z.object({
  // This may be blank if the question is optional
  question: nonBlankString,
  answer: z.string(),
  position: z.number(),
})
export type QuestionsAndAnswer = z.infer<typeof questionsAndAnswerSchema>

export const trackingSchema = z.object({
  utm_campaign: z.string().nullable(),
  utm_source: z.string().nullable(),
  utm_medium: z.string().nullable(),
  utm_content: z.string().nullable(),
  utm_term: z.string().nullable(),
  salesforce_uuid: z.string().nullable(),
})
export type Tracking = z.infer<typeof trackingSchema>

export const cancellationSchema = z.object({
  canceled_by: nonBlankString,
  reason: nonBlankString.nullable(),
  canceler_type: nonBlankString,
  created_at: z.coerce.date(),
})
export type Cancellation = z.infer<typeof cancellationSchema>

export const paymentSchema = z.object({
  external_id: nonBlankString,
  provider: nonBlankString,
  amount: z.number().min(0),
  currency: nonBlankString,
  terms: nonBlankString.nullable(),
  successful: z.boolean(),
})
export type Payment = z.infer<typeof paymentSchema>

export const eventMembershipSchema = z.object({
  user: calendlyUri,
  user_email: nonBlankString.email(),
  user_name: nonBlankString,
})
export type EventMembership = z.infer<typeof eventMembershipSchema>

export const inviteesCounterSchema = z.object({
  total: z.number(),
  active: z.number(),
  limit: z.number(),
})
export type InviteesCounter = z.infer<typeof inviteesCounterSchema>

export const eventGuestSchema = z.object({
  email: nonBlankString.email(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
})
export type EventGuest = z.infer<typeof eventGuestSchema>

// This will be implemented later
// export const locationSchema = z.object({
//   join_url: z.string(),
//   status: z.string(),
//   type: z.string(),
// })
// export type Location = z.infer<typeof locationSchema>

export const scheduledEventSchema = z.object({
  uri: calendlyUri,
  name: nonBlankString.nullable(),
  meeting_notes_plain: nonBlankString.nullable(),
  meeting_notes_html: nonBlankString.nullable(),
  status: nonBlankString,
  start_time: z.coerce.date(),
  end_time: z.coerce.date(),
  event_type: calendlyUri,
  // location: locationSchema, // This has many variants, I'll map it in a later commit
  invitees_counter: inviteesCounterSchema,
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
  event_memberships: z.array(eventMembershipSchema),
  event_guests: z.array(eventGuestSchema),
  cancellation: cancellationSchema,
})
export type ScheduledEvent = z.infer<typeof scheduledEventSchema>

export const inviteeEventPayloadSchema = z.object({
  uri: calendlyUri,
  email: nonBlankString.email(),
  first_name: nonBlankString.nullable(),
  last_name: nonBlankString.nullable(),
  name: nonBlankString,
  status: nonBlankString,
  questions_and_answers: z.array(questionsAndAnswerSchema),
  timezone: nonBlankString.nullable(),
  event: calendlyUri,
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
  tracking: trackingSchema,
  text_reminder_number: nonBlankString.nullable(),
  rescheduled: z.boolean(),
  old_invitee: calendlyUri.nullable(),
  new_invitee: calendlyUri.nullable(),
  cancel_url: calendlyUri,
  reschedule_url: calendlyUri,
  routing_form_submission: calendlyUri.nullable(),
  cancellation: cancellationSchema,
  payment: paymentSchema.nullable(),
  no_show: z
    .object({
      uri: nonBlankString.url(),
      created_at: z.coerce.date(),
    })
    .nullable(),
  reconfirmation: z
    .object({
      created_at: z.coerce.date(),
      confirmed_at: z.coerce.date().nullable(),
    })
    .nullable(),
  scheduling_method: nonBlankString.nullable(),
  invitee_scheduled_by: nonBlankString.nullable(),
  scheduled_event: scheduledEventSchema,
})
export type InviteeEventPayload = z.infer<typeof inviteeEventPayloadSchema>

export const InviteeEventSchema = z.object({
  event: nonBlankString,
  created_at: z.coerce.date(),
  created_by: nonBlankString.url(),
  payload: inviteeEventPayloadSchema,
})
export type InviteeCanceledEventElement = z.infer<typeof InviteeEventSchema>
