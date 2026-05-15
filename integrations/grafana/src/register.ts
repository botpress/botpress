import * as sdk from '@botpress/sdk'
import * as bp from '../.botpress'
import { listFolders } from './clients/folders'
import { getK8sNamespace } from './clients/config'

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

  await client.setState({
    type: 'integration',
    name: 'webhookConfig',
    id: ctx.integrationId,
    payload: { webhookUrl, k8sNamespace, webhookSecret: crypto.randomUUID() },
  })
}
