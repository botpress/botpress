import { IntegrationDefinition, z } from '@botpress/sdk'
import { actions } from './definitions'

export default new IntegrationDefinition({
  name: 'attio',
  version: '0.1.0',
  title: 'Attio',
  readme: 'hub.md',
  icon: 'icon.svg',
  description: 'Attio integration', // TODO: add description
  configuration: {
    schema: z.object({
      accessToken: z.string().title('Access Token').describe('The Access token of the Attio integration'),
    }),
  },
  actions,
})
