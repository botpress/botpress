import { RuntimeError } from '@botpress/sdk'
import { getLinearClient } from '../misc/utils'
import * as bp from '.botpress'

export const sendRawGraphqlQuery: bp.IntegrationProps['actions']['sendRawGraphqlQuery'] = async (args) => {
  const {
    ctx,
    input: { query, parameters },
  } = args

  const mappedParams = parameters?.reduce(
    (mapped, param) => {
      mapped[param.name] = param.value
      return mapped
    },
    {} as Record<string, unknown>
  )
  try {
    const linearClient = await getLinearClient(args, ctx.integrationId)
    const result = await linearClient.client.rawRequest(query, mappedParams)
    return { result: result.data }
  } catch (thrown) {
    const error = thrown instanceof Error ? thrown : new Error(String(thrown))
    throw new RuntimeError(`Failed to query the Linear API: ${error.message}`)
  }
}
