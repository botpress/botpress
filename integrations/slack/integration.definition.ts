import { IntegrationDefinition, z } from '@botpress/sdk'
import typingIndicator from 'bp_modules/typing-indicator'

import {
  actions,
  channels,
  configuration,
  configurations,
  events,
  identifier,
  secrets,
  states,
  user,
} from './definitions'

// TODO: use default options
const toJSONSchemaOptions: z.transforms.JSONSchemaGenerationOptions = {
  unionStrategy: 'anyOf',
  discriminator: false,
}

export default new IntegrationDefinition({
  name: 'slack',
  title: 'Slack',
  description: 'Automate interactions with your team.',
  version: '4.0.4',
  icon: 'icon.svg',
  readme: 'hub.md',
  configuration,
  configurations,
  identifier,
  states,
  channels,
  actions,
  events,
  secrets,
  user,
  attributes: {
    category: 'Communication & Channels',
  },
  __advanced: {
    toJSONSchemaOptions,
  },
}).extend(typingIndicator, () => ({
  entities: {},
}))
