import { ActionDefinition, z } from '@botpress/sdk'
import {
  sessionSchema,
  getAgentJobByIdInputSchema,
  getAllAgentJobsOutputSchema,
  createAgentJobInputSchema,
  createAgentJobOutputSchema,
} from '../schemas'

const createAgentJob: ActionDefinition = {
  title: 'Create Agent job',
  description: 'Creates a new agent job that can generate and edit documentation in a branch based on a prompt.',
  input: {
    schema: createAgentJobInputSchema,
  },
  output: {
    schema: createAgentJobOutputSchema,
  },
}

const getAllAgentJobs: ActionDefinition = {
  title: 'Get All Agent Jobs',
  description: 'Retrieve all agent jobs, including their status and details.',
  input: {
    schema: z.object({}),
  },
  output: {
    schema: getAllAgentJobsOutputSchema,
  },
}

const getAgentJobById: ActionDefinition = {
  title: 'Get Agent Job by ID',
  description: 'Retrieve the details and status of a specific agent job by its ID.',
  input: {
    schema: getAgentJobByIdInputSchema,
  },
  output: {
    schema: sessionSchema,
  },
}

export const actions = {
  createAgentJob,
  getAllAgentJobs,
  getAgentJobById,
} as const
