import { IntegrationDefinition, z } from '@botpress/sdk'

export default new IntegrationDefinition({
  name: 'plus/mixpanel',
  title: 'Mixpanel',
  description: 'Track Botpress Analytics events in Mixpanel',
  icon: 'logo.svg',
  version: '0.2.3',
  readme: 'hub.md',
  configuration: {
    schema: z.object({
      token: z.string().describe('The token for your Mixpanel project'),
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
