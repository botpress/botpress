import { z } from '@botpress/sdk'
import { calendlyUri, nonBlankString } from './common'
import { calendlyLocationSchema } from './event-locations'

export const questionsAndAnswerSchema = z.object({
  question: nonBlankString,
  // The 'answer' may be blank
  // if the question is optional
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

export const scheduledEventSchema = z.object({
  uri: calendlyUri,
  name: nonBlankString.nullable(),
  meeting_notes_plain: nonBlankString.nullable().optional(),
  meeting_notes_html: nonBlankString.nullable().optional(),
  status: nonBlankString,
  start_time: z.coerce.date(),
  end_time: z.coerce.date(),
  event_type: calendlyUri,
  location: calendlyLocationSchema,
  invitees_counter: inviteesCounterSchema,
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
  event_memberships: z.array(eventMembershipSchema),
  event_guests: z.array(eventGuestSchema),
  cancellation: cancellationSchema.optional(),
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
  cancellation: cancellationSchema.optional(),
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

export const inviteeEventSchema = z.object({
  event: z.union([
    z.literal('invitee.created'),
    z.literal('invitee.canceled'),
    z.literal('invitee_no_show.created'),
    z.literal('invitee_no_show.deleted'),
  ]),
  created_at: z.coerce.date(),
  created_by: calendlyUri,
  payload: inviteeEventPayloadSchema,
})
export type InviteeEvent = z.infer<typeof inviteeEventSchema>

export const inviteeEventOutputSchema = z.object({
  eventName: nonBlankString.describe('The name of the scheduled event').title('Scheduled Event Name'),
  startTime: z.date().describe('The start time of the scheduled event').title('Start Time'),
  endTime: z.date().describe('The end time of the scheduled event').title('End Time'),
  locationType: nonBlankString
    .describe('The type of location for the scheduled event')
    .title("Location Type (e.g. 'zoom', 'google_conference', 'microsoft_teams_conference')"),
  organizerName: nonBlankString.describe('The name of the event organizer').title('Organizer Name'),
  organizerEmail: nonBlankString.email().describe('The email of the event organizer').title('Organizer Email'),
  inviteeName: nonBlankString.describe('The name of the invitee').title('Invitee Name'),
  inviteeEmail: nonBlankString.email().describe('The email of the invitee').title('Invitee Email'),
  conversationId: z
    .string()
    .nullable()
    .describe('The conversation ID associated with the event, if available')
    .title('Conversation ID'),
})
