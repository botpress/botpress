import { z, IntegrationDefinition } from '@botpress/sdk'
import {
  createCandidateInJob,
  createCandidateInTalentPool,
  getCandidate,
  listCandidates,
  updateCandidate,
} from 'definitions/actions/candidates'
import { getJobQuestions } from 'definitions/actions/jobs'
import { candidateCreated, candidateMoved } from 'definitions/events/candidates'

export default new IntegrationDefinition({
  name: 'workable',
  title: 'Workable',
  description: 'Integration with Workable for Botpress',
  version: '0.1.1',
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
    webhooks: {
      type: 'integration',
      schema: z.object({
        ids: z.array(z.number()).title('ID').describe('The ID of the webhook'),
      }),
    },
  },
  actions: {
    listCandidates,
    getCandidate,
    createCandidateInJob,
    createCandidateInTalentPool,
    updateCandidate,
    getJobQuestions,
  },
  events: {
    candidateCreated,
    candidateMoved,
  },
})
