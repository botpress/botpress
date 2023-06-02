import { IntegrationDefinition, messages } from '@botpress/sdk'
import { name } from './package.json'

export default new IntegrationDefinition({
  name,
  version: '0.0.1',
  public: false,
  channels: {
    channel: {
      messages: { ...messages.defaults },
    },
  },
})
