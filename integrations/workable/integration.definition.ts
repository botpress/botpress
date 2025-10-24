import { z, IntegrationDefinition } from '@botpress/sdk'
import { getCandidate, listCandidates } from 'definitions/actions/candidates'
import { candidateCreated, candidateMoved } from 'definitions/events/candidates'

export default new IntegrationDefinition({
  name: 'workable',
  title: 'Workable',
  description: 'Integration with Workable for Botpress',
  version: '0.1.0',
  readme: 'hub.md',
  icon: 'icon.svg',
  configuration: {
    schema: z.object({
      apiToken: z
        .string()
        .min(1, 'API token is required')
        .describe('Your Workable API access token')
        .title('API access token'),
      subDomain: z
        .string()
        .min(1, 'Account subdomain is required')
        .describe('Your account subdomain is required')
        .title('Account subdomain'),
    }),
  },
  states: {
    webhookIds: {
      type: 'integration',
      schema: z.object({
        ids: z.array(z.number()).title('IDs').describe('The IDs of the registered webhooks'),
      }),
    },
  },
  actions: {
    listCandidates,
    getCandidate,
  },
  events: {
    candidateCreated,
    candidateMoved,
  },
})
