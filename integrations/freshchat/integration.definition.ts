import { IntegrationDefinition, interfaces } from '@botpress/sdk'
import { INTEGRATION_NAME } from './src/const'
import { actions, events, configuration, channels, states, user } from './src/definitions'

export default new IntegrationDefinition({
  name: INTEGRATION_NAME,
  title: 'Freshchat HITL',
  version: '1.0.1',
  icon: 'icon.svg',
  description: 'This integration allows your bot to use Freshchat as a HITL Provider',
  readme: 'hub.md',
  configuration,
  states,
  channels,
  actions,
  events,
  user
}).extend(interfaces.hitl, () => ({}))

