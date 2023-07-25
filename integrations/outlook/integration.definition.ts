import { IntegrationDefinition } from '@botpress/sdk'

import {
  configuration,
  states,
  user,
  channels,
  actions,
} from './src/definitions'

export default new IntegrationDefinition({
  name: 'outlook',
  version: '0.2.0',
  readme: 'readme.md',
  configuration,
  channels,
  user,
  actions,
  events: {},
  states,
})
