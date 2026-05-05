import { IntegrationDefinition, z } from '@botpress/sdk'

export default new IntegrationDefinition({
  name: 'google-analytics',
  title: 'Google Analytics',
  description: 'Track bot events and user activity in Google Analytics.',
  icon: 'icon.svg',
  version: '1.0.0',
  readme: 'hub.md',
  configuration: {
    schema: z.object({
      measurementId: z
        .string()
        .min(1, 'Measurement ID is required')
        .title('Measurement ID')
        .describe('The Measurement ID for your Google Analytics 4 property'),
      apiSecret: z
        .string()
        .secret()
        .min(1, 'API Secret is required')
        .title('API Secret')
        .describe('The API Secret for your Google Analytics 4 property'),
    }),
  },
  actions: {
    updateUserProfile: {
      title: 'Update User Profile',
      description: "Update a user's profile information in Google Analytics.",
      input: {
        schema: z.object({
          userId: z.string().min(1).title('User ID').describe('The user ID of the profile you want to update'),
          userProfile: z
            .string()
            .title('User Profile')
            .describe("JSON object string containing the user's metadata, such as email or name")
            .optional(),
        }),
      },
      output: {
        schema: z.object({}),
      },
    },
    trackNode: {
      title: 'Track Node',
      description: 'Track a node execution as a page view in Google Analytics.',
      input: {
        schema: z.object({
          userId: z.string().min(1).title('User ID').describe('The user ID to track'),
          nodeId: z.string().min(1).title('Node ID').describe('A unique ID representing the node being tracked'),
        }),
      },
      output: {
        schema: z.object({}),
      },
    },
    trackEvent: {
      title: 'Track Event',
      description: 'Track a custom event in Google Analytics.',
      input: {
        schema: z.object({
          userId: z.string().min(1).title('User ID').describe('The user ID to track'),
          eventName: z.string().min(1).title('Event Name').describe('The event name to track'),
          eventPayload: z
            .string()
            .title('Event Payload')
            .describe('JSON object string containing the properties of the event')
            .optional(),
        }),
      },
      output: {
        schema: z.object({}),
      },
    },
  },
  channels: {},
  attributes: {
    category: 'Marketing & Email',
    repo: 'botpress',
  },
})
