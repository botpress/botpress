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
const toJSONSchemaOptions: Partial<z.transforms.JSONSchemaGenerationOptions> = {
  discriminatedUnionStrategy: 'anyOf',
  discriminator: false,
}

export default new IntegrationDefinition({
  name: 'slack',
  title: 'Slack',
  description: 'Automate interactions with your team.',
  version: '4.0.5',
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
    guideSlug: 'slack',
    repo: 'botpress',
  },
  __advanced: {
    toJSONSchemaOptions,
  },
}).extend(typingIndicator, () => ({
  entities: {},
}))
