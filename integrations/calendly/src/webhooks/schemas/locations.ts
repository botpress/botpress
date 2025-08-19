import { z } from '@botpress/sdk'

const inPersonMeetingSchema = z.object({
  type: z.literal('physical'),
  location: z.string().describe('The physical location specified by the event host (publisher)'),
  additional_info: z.string().optional(),
})

const outboundCallSchema = z.object({
  type: z.literal('outbound_call'),
  location: z.string().nullable().describe('The phone number the event host (publisher) will use to call the invitee'),
})

const inboundCallSchema = z.object({
  type: z.literal('inbound_call'),
  location: z.string().describe('The phone number the invitee will use to call the event host (publisher)'),
  additional_info: z.string().optional(),
})

const googleConferenceSchema = z.object({
  type: z.literal('google_conference'),
  status: z.string().nullable(),
  join_url: z.string().url().nullable(),
})

const zoomConferenceSchema = z.object({
  type: z.literal('zoom'),
  status: z.string().nullable(),
  join_url: z.string().url().nullable(),
  data: z
    .object({
      id: z.string().optional().describe('The Zoom meeting ID'),
      settings: z
        .object({
          global_dial_in_numbers: z
            .array(
              z.object({
                number: z.string().optional(),
                country: z.string().optional().describe('Country Code'),
                type: z.string().optional(),
                city: z.string().optional(),
                country_name: z.string().optional(),
              })
            )
            .optional()
            .describe('Global dial-in numbers for the Zoom meeting'),
        })
        .optional(),
      extra: z
        .object({
          intl_numbers_url: z.string().url().optional(),
        })
        .optional(),
      password: z.string().optional(),
    })
    .nullable(),
})

const goToMeetingConferenceSchema = z.object({
  type: z.literal('gotomeeting'),
  status: z.string().nullable(),
  join_url: z.string().url().nullable(),
  data: z
    .object({
      uniqueMeetingId: z.number().optional(),
      conferenceCallInfo: z.string().optional(),
    })
    .nullable(),
})

const microsoftTeamsConferenceSchema = z.object({
  type: z.literal('microsoft_teams_conference'),
  status: z.string().nullable(),
  join_url: z.string().url().nullable(),
  data: z
    .object({
      id: z.string().optional(),
      audioConferencing: z
        .object({
          conferenceId: z.string().optional(),
          dialinUrl: z.string().url().optional(),
          tollNumber: z.string().optional(),
        })
        .nullable()
        .optional(),
    })
    .nullable(),
})

const customLocationSchema = z.object({
  type: z.literal('custom'),
  location: z.string().nullable(),
})

const inviteeSpecifiedLocationSchema = z.object({
  type: z.literal('ask_invitee'),
  location: z.string(),
})

const webexConferenceSchema = z.object({
  type: z.literal('webex_conference'),
  status: z.string().nullable(),
  join_url: z.string().url().nullable(),
  data: z
    .object({
      id: z.string(),
      telephony: z.object({
        callInNumbers: z.array(
          z.object({
            label: z.string(),
            callInNumber: z.string(),
            tollType: z.string(),
          })
        ),
      }),
      password: z.string(),
    })
    .nullable(),
})

export const calendlyLocationSchema = z.union([
  inPersonMeetingSchema,
  outboundCallSchema,
  inboundCallSchema,
  googleConferenceSchema,
  zoomConferenceSchema,
  goToMeetingConferenceSchema,
  microsoftTeamsConferenceSchema,
  customLocationSchema,
  inviteeSpecifiedLocationSchema,
  webexConferenceSchema,
])
export type CalendlyLocation = z.infer<typeof calendlyLocationSchema>
