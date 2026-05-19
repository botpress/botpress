import * as sdk from '@botpress/sdk'
import * as bp from '../.botpress'
import { GrafanaClient } from './client'

export const register: bp.IntegrationProps['register'] = async ({ ctx, client, webhookUrl }) => {
  const grafana = new GrafanaClient(ctx.configuration)

  let result: Awaited<ReturnType<typeof grafana.listFolders>>
  try {
    result = await grafana.listFolders()
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

  const k8sNamespace = await grafana.namespace()

  await client.setState({
    type: 'integration',
    name: 'webhookConfig',
    id: ctx.integrationId,
    payload: { webhookUrl, k8sNamespace, webhookSecret },
  })
}
