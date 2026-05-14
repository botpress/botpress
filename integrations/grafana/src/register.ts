import * as sdk from '@botpress/sdk'
import * as bp from '../.botpress'
import { listFolders } from './clients/folders'

export const register: bp.IntegrationProps['register'] = async ({ ctx, client, webhookUrl }) => {
  let result: Awaited<ReturnType<typeof listFolders>>
  try {
    result = await listFolders(ctx.configuration)
  } catch (e) {
    throw new sdk.RuntimeError(`Could not reach Grafana — check your username and token. ${e}`)
  }

  if (!result.success) {
    throw new sdk.RuntimeError(`Grafana configuration is invalid: ${result.error}`)
  }

  await client.setState({
    type: 'integration',
    name: 'webhookConfig',
    id: ctx.integrationId,
    payload: { webhookUrl },
  })
}
