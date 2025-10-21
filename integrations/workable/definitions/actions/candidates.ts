import { ActionDefinition } from '@botpress/sdk'
import {
  getCandidateInputModel,
  getCandidateOutputModel,
  listCandidatesInputModel,
  listCandidatesOutputModel,
} from 'definitions/models/candidates'

export const listCandidates = {
  title: 'List candidates',
  description: 'List the candidates for a job',
  input: {
    schema: listCandidatesInputModel,
  },
  output: {
    schema: listCandidatesOutputModel,
  },
} satisfies ActionDefinition

export const getCandidate = {
  title: 'Get candidate',
  description: 'Get a candidate by ID',
  input: {
    schema: getCandidateInputModel,
  },
  output: {
    schema: getCandidateOutputModel,
  },
} satisfies ActionDefinition
