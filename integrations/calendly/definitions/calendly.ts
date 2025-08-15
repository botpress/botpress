import { z } from '@botpress/sdk'
import { nonBlankString } from './common'

const calendlyUri = nonBlankString.url().brand('CalendlyUri')
export type CalendlyUri = z.infer<typeof calendlyUri>

/** @see https://developer.calendly.com/api-docs/005832c83aeae-get-current-user */
export const getCurrentUserResponseSchema = z.object({
  resource: z.object({
    avatar_url: nonBlankString.url().nullable(),
    created_at: z.coerce.date(),
    current_organization: calendlyUri,
    email: nonBlankString.email(),
    locale: z.union([
      z.literal('en'),
      z.literal('fr'),
      z.literal('es'),
      z.literal('de'),
      z.literal('pt'),
      z.literal('ps'),
    ]),
    /** Human Readable format */
    name: nonBlankString,
    resource_type: nonBlankString,
    scheduling_url: nonBlankString.url(),
    slug: nonBlankString,
    time_notation: z.union([z.literal('12h'), z.literal('24h')]),
    /** e.g. 'America/New_York' */
    timezone: nonBlankString,
    updated_at: z.coerce.date(),
    /** The user's calendly URI */
    uri: calendlyUri,
  }),
})
export type GetCurrentUserResponse = z.infer<typeof getCurrentUserResponseSchema>
