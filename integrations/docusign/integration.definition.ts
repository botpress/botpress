import { IntegrationDefinition, z } from '@botpress/sdk'
import { sendEnvelopeInputSchema, sendEnvelopeOutputSchema } from 'definitions/actions'

export default new IntegrationDefinition({
  name: 'docusign',
  title: 'Docusign',
  version: '2.0.1',
  readme: 'hub.md',
  icon: 'icon.svg',
  description:
    'Automate document workflows, generate intelligent insights, enhance security measures, and improve user experience.',
  actions: {
    sendEnvelope: {
      title: 'Send Envelope',
      description: 'Sends an envelope (document) to a recipient to sign it',
      input: {
        schema: sendEnvelopeInputSchema,
      },
      output: {
        schema: sendEnvelopeOutputSchema,
      },
    },
  },
})
