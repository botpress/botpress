import * as sdk from '@botpress/sdk'
import axios from 'axios'
import * as bp from '../../.botpress'
import { getn8nClient, wrapn8nError } from './utils'

export const getWorkflow = async ({ ctx, input }: bp.ActionProps['getWorkflow']) => {
  const n8nClient = getn8nClient(ctx.configuration)

  try {
    const { data } = await n8nClient.get(`/workflows/${encodeURIComponent(input.workflowId)}`, {
      params: {
        excludePinnedData: input.excludePinnedData ?? true,
      },
    })
    return { workflow: data }
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      throw new sdk.RuntimeError(`n8n workflow "${input.workflowId}" not found`)
    }
    return wrapn8nError(error)
  }
}
