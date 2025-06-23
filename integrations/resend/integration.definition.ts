import { IntegrationDefinition } from '@botpress/sdk'

export default new IntegrationDefinition({
  name: 'resend',
  title: 'Resend',
  version: '0.0.1',
  readme: 'hub.md',
  icon: 'icon.svg',
  description: 'Send simple plain text emails using the Resend email service.',
})
