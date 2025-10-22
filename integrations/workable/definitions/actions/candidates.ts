import { ActionDefinition } from '@botpress/sdk'
import {
  getCandidateInputSchema,
  getCandidateOutputSchema,
  listCandidatesInputSchema,
  listCandidatesOutputSchema,
} from 'definitions/models/candidates'

export const listCandidates = {
  title: 'List candidates',
  description: 'List the candidates for a job',
  input: {
    schema: listCandidatesInputSchema,
  },
  output: {
    schema: listCandidatesOutputSchema,
  },
} satisfies ActionDefinition

export const getCandidate = {
  title: 'Get candidate',
  description: 'Get a candidate by ID',
  input: {
    schema: getCandidateInputSchema,
  },
  output: {
    schema: getCandidateOutputSchema,
  },
} satisfies ActionDefinition
