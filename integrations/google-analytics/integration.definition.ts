import { IntegrationDefinition, z } from '@botpress/sdk'

export default new IntegrationDefinition({
  name: 'plus/google-analytics',
  title: 'Google Analytics',
  description: 'Track Botpress Analytics events in Google Analytics',
  icon: 'icon.svg',
  version: '0.2.4',
  readme: 'hub.md',
  configuration: {
    schema: z.object({
      measurementId: z.string().describe('The Measurement ID for your Google Analytics 4 property'),
      apiSecret: z
        .string()
        .describe('The API Secret for your Google Analytics 4 property (optional, used for more secure data sending)'),
    }),
  },
  actions: {
    updateUserProfile: {
      title: `Update User Profile`,
      description: `Updates the User's profile in Google Analytics`,
      input: {
        schema: z.object({
          userId: z.string().describe('The user ID of the profile you want to update'),
          userProfile: z.string().describe(`JSON String of a user's metadata (e.g., email, name)`).optional(),
        }),
      },
      output: {
        schema: z.object({}),
      },
    },
    trackNode: {
      title: 'Track Node',
      description: 'Tracks when a node has been triggered, recording it as a page view in Google Analytics.',
      input: {
        schema: z.object({
          userId: z.string().describe('The user ID to track'),
          nodeId: z.string().describe('A unique ID representing the Node being tracked'),
        }),
      },
      output: {
        schema: z.object({}),
      },
    },
    trackEvent: {
      title: 'Track Event',
      description: 'Track event in Google Analytics',
      input: {
        schema: z.object({
          userId: z.string().describe('The user ID to track'),
          eventName: z.string().describe('The event name to track'),
          eventPayload: z.string().describe('The properties of the event as a JSON String').optional(),
        }),
      },
      output: {
        schema: z.object({}),
      },
    },
  },
  channels: {},
})
