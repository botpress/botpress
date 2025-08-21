import { IntegrationDefinition, z } from '@botpress/sdk'
import { scheduleEventInputSchema, scheduleEventOutputSchema } from 'definitions/actions'
import { inviteeEventOutputSchema } from 'definitions/events'

export default new IntegrationDefinition({
  name: 'calendly',
  title: 'Calendly',
  version: '0.0.1',
  readme: 'hub.md',
  icon: 'icon.svg',
  description: 'Schedule meetings and manage events using the Calendly scheduling platform.',
  configuration: {
    identifier: {
      linkTemplateScript: 'linkTemplate.vrl',
    },
    schema: z.object({}),
  },
  configurations: {
    manual: {
      title: 'Manual Configuration',
      description: 'Configure by manually supplying a Calendly Personal Access Token',
      schema: z.object({
        accessToken: z
          .string()
          .secret()
          .min(1)
          .describe('Your Calendly Personal Access Token')
          .title('Personal Access Token'),
      }),
    },
  },
  actions: {
    scheduleEvent: {
      title: 'Schedule Calendly Event',
      description: 'Generates a link for scheduling an event in Calendly',
      input: { schema: scheduleEventInputSchema },
      output: { schema: scheduleEventOutputSchema },
    },
  },
  events: {
    eventScheduled: {
      title: 'Event Scheduled',
      description: 'An event that triggers when an invitee fills out and submits a scheduling form',
      schema: inviteeEventOutputSchema,
    },
    eventCanceled: {
      title: 'Event Canceled',
      description: 'An event that triggers when an invitee cancels a scheduled event',
      schema: inviteeEventOutputSchema,
    },
    eventNoShowCreated: {
      title: 'Event No Show Created',
      description: 'An event that triggers when an invitee is marked as a no-show',
      schema: inviteeEventOutputSchema,
    },
    eventNoShowDeleted: {
      title: 'Event No Show Deleted',
      description: 'An event that triggers when an invitee is unmarked as a no-show',
      schema: inviteeEventOutputSchema,
    },
  },
  secrets: {
    OAUTH_CLIENT_ID: {
      description: "The unique identifier that's used to initiate the OAuth flow",
    },
    OAUTH_CLIENT_SECRET: {
      description: "A secret that's used to establish and refresh the OAuth authentication",
    },
    OAUTH_WEBHOOK_SIGNING_KEY: {
      description: "The signing key used to validate Calendly's OAuth webhook request payloads",
    },
  },
  states: {
    configuration: {
      type: 'integration',
      schema: z.object({
        oauth: z
          .object({
            refreshToken: z.string().describe('The refresh token for the integration').title('Refresh Token'),
            accessToken: z.string().describe('The access token for the integration').title('Access Token'),
            expiresAt: z
              .number()
              .min(0)
              .describe('The expiry time of the access token represented as a Unix timestamp (milliseconds)')
              .title('Expires At'),
          })
          .describe('The parameters used for accessing the Calendly API and refreshing the access token')
          .title('OAuth Parameters')
          .nullable(),
      }),
    },
  },
})
