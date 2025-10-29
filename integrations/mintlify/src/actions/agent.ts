import { RuntimeError } from '@botpress/sdk'
import {
  getAllAgentJobsOutputSchema,
  createAgentJobInputSchema,
  createAgentJobOutputSchema,
  getAgentJobByIdInputSchema,
  sessionSchema,
} from 'definitions/schemas'
import { getAxiosClient } from 'src/utils/axiosClient'
import { extractError } from 'src/utils/errorUtils'
import * as bp from '.botpress'

export const createAgentJob: bp.IntegrationProps['actions']['createAgentJob'] = async ({
  input,
  client,
  ctx,
  logger,
}) => {
  try {
    const parsed = createAgentJobInputSchema.parse(input)
    const mintlifyClient = await getAxiosClient({ ctx, client })

    const data = {
      branch: parsed.branchName,
      messages: [
        {
          role: 'system',
          content: parsed.prompt,
        },
      ],
    }

    const streamingResponse = await mintlifyClient.post('job', data)

    return createAgentJobOutputSchema.parse({
      response: streamingResponse.data,
    })
  } catch (error) {
    throw new RuntimeError(extractError(error, logger))
  }
}

export const getAllAgentJobs: bp.IntegrationProps['actions']['getAllAgentJobs'] = async ({ client, ctx, logger }) => {
  const mintlifyClient = await getAxiosClient({ ctx, client })

  try {
    const response = await mintlifyClient.get('jobs')
    return getAllAgentJobsOutputSchema.parse(response.data)
  } catch (error) {
    throw new RuntimeError(extractError(error, logger))
  }
}

export const getAgentJobById: bp.IntegrationProps['actions']['getAgentJobById'] = async ({
  input,
  client,
  ctx,
  logger,
}) => {
  const mintlifyClient = await getAxiosClient({ ctx, client })

  try {
    const parsed = getAgentJobByIdInputSchema.parse(input)
    const response = await mintlifyClient.get(`job/${[parsed.jobId]}`)
    return sessionSchema.parse(response.data)
  } catch (error) {
    throw new RuntimeError(extractError(error, logger))
  }
}
