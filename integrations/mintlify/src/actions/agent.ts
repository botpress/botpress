import { RuntimeError } from '@botpress/sdk'
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
    const mintlifyClient = await getAxiosClient({ ctx, client })

    const data = {
      branch: input.branchName,
      messages: [
        {
          role: 'system',
          content: input.prompt,
        },
      ],
    }

    const streamingResponse = await mintlifyClient.post('job', data)

    return {
      response: streamingResponse.data,
    }
  } catch (error) {
    throw new RuntimeError(extractError(error, logger))
  }
}

export const getAllAgentJobs: bp.IntegrationProps['actions']['getAllAgentJobs'] = async ({ client, ctx, logger }) => {
  const mintlifyClient = await getAxiosClient({ ctx, client })

  try {
    const response = await mintlifyClient.get('jobs')
    return response.data
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
    const response = await mintlifyClient.get(`job/${[input.jobId]}`)
    return response.data
  } catch (error) {
    throw new RuntimeError(extractError(error, logger))
  }
}
