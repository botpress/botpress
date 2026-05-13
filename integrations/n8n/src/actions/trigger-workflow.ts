import * as sdk from '@botpress/sdk'
import axios from 'axios'
import * as bp from '../../.botpress'
import { buildPublicUrl, getWebhookPath, resolveWorkflowByIdOrName, wrapn8nError } from './utils'

export const triggerWorkflow = async ({ ctx, input }: bp.ActionProps['triggerWorkflow']) => {
  const { workflowIdOrName, conversationId, payload } = input
  const { baseUrl, accessKey } = ctx.configuration

  const workflow = await resolveWorkflowByIdOrName(baseUrl, accessKey, workflowIdOrName)
  const webhookPath = getWebhookPath(workflow)

  if (!webhookPath) {
    throw new sdk.RuntimeError('Unable to find an n8n webhook node with a path parameter in the selected workflow')
  }

  const webhookUrl = buildPublicUrl(baseUrl, `/webhook/${webhookPath.replace(/^\/+/, '')}`)

  let data: unknown
  try {
    // Webhook URLs are public endpoints, no need to use the API key
    const response = await axios.post(webhookUrl, {
      conversationId,
      workflowId: workflow.id,
      workflowName: workflow.name,
      data: payload ?? {},
    })
    data = response.data
  } catch (error) {
    return wrapn8nError(error, 'n8n webhook trigger')
  }

  return {
    workflowId: workflow.id,
    workflowName: workflow.name,
    response: data,
  }
}
