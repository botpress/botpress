import { IntegrationDefinition, z } from '@botpress/sdk'

export default new IntegrationDefinition({
  name: 'plus/segment',
  icon: 'icon.svg',
  title: 'Segment',
  version: '0.2.4',
  description: 'Track Botpress Analytics events in Segment',
  readme: 'hub.md',
  channels: {},
  configuration: {
    schema: z.object({
      writeKey: z.string().describe('The write key for Segment Analytics'),
    }),
  },
  actions: {
    updateUserProfile: {
      title: `Update User Profile`,
      description: `Updates the User's profile (identifying information such as email, name, etc.)`,
      input: {
        schema: z.object({
          userId: z.string().describe('The user id of the profile you want to update'),
          userProfile: z.string().describe(`JSON String of a user's metadata (e.g., email, name)`).optional(),
        }),
      },
      output: {
        schema: z.object({}),
      },
    },
    trackNode: {
      title: 'Track Node',
      description: 'Tracks when the node has been triggered.',
      input: {
        schema: z.object({
          userId: z.string().describe('The user id to track'),
          nodeId: z.string().describe('A unique ID representing the Node being tracked'),
        }),
      },
      output: {
        schema: z.object({}),
      },
    },
    trackEvent: {
      title: 'Track Event',
      description: 'Track event',
      input: {
        schema: z.object({
          userId: z.string().describe('The user id to track'),
          eventName: z.string().describe('The event name to track'),
          eventPayload: z.string().describe('The properties of the event as a JSON String').optional(),
        }),
      },
      output: {
        schema: z.object({}),
      },
    },
  },
})
