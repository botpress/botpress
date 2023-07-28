import { IntegrationDefinition } from '@botpress/sdk'
import { name } from './package.json'

import { configuration, actions } from './src/definitions'

export default new IntegrationDefinition({
  name,
  version: '0.2.0',
  channels: {},
  configuration,
  actions,
})
