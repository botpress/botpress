import { z } from '@botpress/sdk'
import { TrelloEventType } from 'definitions/events'
import { trelloIdSchema } from 'definitions/schemas'

export const trelloWebhookSchema = z.object({
  /** Action ID (aka Event ID) */
  id: trelloIdSchema,
  /** Event Triggered Date */
  date: z.coerce.date(),
  type: z.nativeEnum(TrelloEventType),
  data: z.any(),
  /** The Trello app that triggered the event. (e.g. Via http request using an API key & token)
   *
   *  @remark This field is `null` when the event was not triggered by an app. */
  appCreator: z
    .object({
      /** Some internal Trello identifier for the app that triggered the event.
       *
       *  @remark At the time of writing (2026-01-15), this field cannot be linked back to any
       *   specific API key or token, as Trello does not expose an endpoint for that purpose.
       *   Also, through testing each of the endpoints, I have not been able to find it within
       *   other endpoint responses. */
      id: trelloIdSchema,
    })
    .nullable(),
  /** Member who initiated the action, or the member
   *  who created the app that initiated the action
   *  (if "appCreator" is not null).
   *
   *  @remark This still appears to be present even if
   *   the action was initiated via an API key & token. */
  memberCreator: z.object({
    id: trelloIdSchema,
    fullName: z.string(),
    username: z.string(),
    initials: z.string(),
    avatarHash: z.string(),
    avatarUrl: z.string(),
  }),
})
export type TrelloWebhook = z.infer<typeof trelloWebhookSchema>
