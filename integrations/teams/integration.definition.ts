import { IntegrationDefinition, z } from '@botpress/sdk'
import typingIndicator from 'bp_modules/typing-indicator'
import { actions, channels, user, states } from 'definitions'

export default new IntegrationDefinition({
  name: 'teams',
  version: '2.1.0',
  title: 'Microsoft Teams',
  description: 'Interact with users, deliver notifications, and perform actions within Microsoft Teams.',
  icon: 'icon.svg',
  readme: 'hub.md',
  configuration: {
    schema: z.object({
      appId: z.string().min(1).title('App ID').describe('Teams application ID'),
      appPassword: z.string().min(1).title('App Password').describe('Teams application password'),
      tenantId: z.string().optional().title('Tenant ID').describe('Teams tenant ID'),
      collectUserEmail: z
        .boolean()
        .default(true)
        .title('Collect User Email')
        .describe(
          "Look up the sender's email address, log it, and store it as the user's email tag. When disabled, users are identified by their Teams user ID only"
        ),
    }),
  },
  channels,
  user,
  actions,
  events: {},
  states,

  attributes: {
    category: 'Communication & Channels',
    guideSlug: 'teams',
    repo: 'botpress',
  },
}).extend(typingIndicator, () => ({ entities: {} }))
