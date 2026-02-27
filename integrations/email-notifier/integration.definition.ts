import { IntegrationDefinition } from '@botpress/sdk'
import { actions, events, states } from 'src/definitions/index'

export default new IntegrationDefinition({
  name: 'plus/email-notifier',
  version: '1.1.1',
  title: 'Email Notifier',
  description: 'Send emails to your Botpress bot in minutes',
  readme: 'hub.md',
  icon: 'icon.svg',
  secrets: {
    AWS_REGION: {
      description: 'AWS Region',
    },
    AWS_ACCESS_KEY_ID: {
      description: 'AWS Access Key ID',
    },
    AWS_SECRET_ACCESS_KEY: {
      description: 'AWS Secret Access Key',
    },
  },
  actions,
  states,
  events,
})
