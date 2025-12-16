import { IntegrationDefinition, z } from '@botpress/sdk'
import { actions, states, events } from './definitions'

export default new IntegrationDefinition({
  name: 'attio',
  version: '1.0.0',

  title: 'Attio',
  readme: 'hub.md',
  icon: 'icon.svg',
  description: 'Interact with Attio from your chatbot',
  configuration: {
    schema: z.object({
      accessToken: z.string().title('Access Token').describe('The Access token of the Attio integration'),
    }),
  },
  actions,
  states,
  events,
  __advanced: {
    useLegacyZuiTransformer: true,
  },
})
