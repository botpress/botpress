import { IntegrationDefinition, z } from '@botpress/sdk'
import { sentry as sentryHelpers } from '@botpress/sdk-addons'
import typingIndicator from 'bp_modules/typing-indicator'
import { actions, channels, user, states } from 'definitions'

export default new IntegrationDefinition({
  name: 'teams',
  version: '2.0.1',
  title: 'Microsoft Teams',
  description: 'Interact with users, deliver notifications, and perform actions within Microsoft Teams.',
  icon: 'icon.svg',
  readme: 'hub.md',
  configuration: {
    schema: z.object({
      appId: z.string().min(1).title('App ID').describe('Teams application ID'),
      appPassword: z.string().min(1).title('App Password').describe('Teams application password'),
      tenantId: z.string().optional().title('Tenant ID').describe('Teams tenant ID'),
    }),
  },
  channels,
  user,
  actions,
  events: {},
  states,
  secrets: sentryHelpers.COMMON_SECRET_NAMES,
}).extend(typingIndicator, () => ({ entities: {} }))
