import { IntegrationDefinition, z } from '@botpress/sdk'
import { actions } from './actions'

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
  actions: {
    createRecord: {
      title: 'Create Record',
      description: 'Create a record in Attio',
      input: {
        schema: z.object({
          path: z.string().title('Path').describe('The path of the record to create'),
          body: z.object({

          })
        })
      }
    },
  },

})
