import * as sdk from '@botpress/sdk'
import * as bp from '../.botpress'
import { getK8sNamespace } from './clients/config'
import { listFolders } from './clients/folders'

export const register: bp.IntegrationProps['register'] = async ({ ctx, client, webhookUrl }) => {
  let result: Awaited<ReturnType<typeof listFolders>>
  let k8sNamespace: string
  try {
    k8sNamespace = await getK8sNamespace(ctx.configuration)
    result = await listFolders(ctx.configuration, k8sNamespace)
  } catch (error_: unknown) {
    const e = error_ instanceof Error ? error_ : new Error(String(error_))
    throw new sdk.RuntimeError(`Could not reach Grafana — check your username and token. ${e.message}`)
  }

  if (!result.success) {
    throw new sdk.RuntimeError(`Grafana configuration is invalid: ${result.error}`)
  }

  let existingState: Awaited<ReturnType<typeof client.getState>>
  try {
    existingState = await client.getState({ type: 'integration', name: 'webhookConfig', id: ctx.integrationId })
  } catch (e) {
    throw new sdk.RuntimeError(`Failed to read integration state: ${e instanceof Error ? e.message : String(e)}`)
  }
  const webhookSecret = existingState.state.payload.webhookSecret || crypto.randomUUID()

  await client.setState({
    type: 'integration',
    name: 'webhookConfig',
    id: ctx.integrationId,
    payload: { webhookUrl, k8sNamespace, webhookSecret },
  })
}
