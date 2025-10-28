import { ActionDefinition } from '@botpress/sdk'
import {
  getCandidateInputSchema,
  getCandidateOutputSchema,
  listCandidatesInputSchema,
  listCandidatesOutputSchema,
  postCandidateInJobInputSchema,
  postCandidateInTalentPoolInputSchema,
  postCandidateOutputSchema,
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

export const createCandidateInJob = {
  title: 'Create candidate in job',
  description: 'Create a candidate in the specified job',
  input: {
    schema: postCandidateInJobInputSchema,
  },
  output: {
    schema: postCandidateOutputSchema,
  },
} satisfies ActionDefinition

export const createCandidateInTalentPool = {
  title: 'Create candidate in talent pool',
  description: 'Create a candidate in the talent pool',
  input: {
    schema: postCandidateInTalentPoolInputSchema,
  },
  output: {
    schema: postCandidateOutputSchema,
  },
} satisfies ActionDefinition
