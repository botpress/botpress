import { routeGetContactpoints, routePostContactpoints, routeDeleteContactpoints } from '../grafana-legacy-client'
import { type GrafanaConfig, legacyClient } from './config'
import { errorMessage } from './utils'

export async function listContactPoints(
  config: GrafanaConfig
): Promise<{ success: boolean; data?: { uid?: string; name?: string; type: string }[]; error?: string }> {
  const { data, error } = await routeGetContactpoints({ client: legacyClient(config) })
  if (error || !data) return { success: false, error: errorMessage(error) }
  const items = data.map((cp) => ({ uid: cp.uid, name: cp.name, type: cp.type }))
  return { success: true, data: items }
}

export async function createContactPoint(
  config: GrafanaConfig,
  input: { webhookUrl: string; secret: string; name?: string }
): Promise<{ success: boolean; uid?: string; error?: string }> {
  const { data, error } = await routePostContactpoints({
    client: legacyClient(config),
    body: {
      name: input.name,
      type: 'webhook',
      settings: {
        url: input.webhookUrl,
        authorization_scheme: 'Bearer',
        authorization_credentials: input.secret,
      },
    },
  })
  if (error || !data) return { success: false, error: errorMessage(error) }
  return { success: true, uid: data.uid }
}

export async function deleteContactPoint(
  config: GrafanaConfig,
  uid: string
): Promise<{ success: boolean; error?: string }> {
  const { error } = await routeDeleteContactpoints({
    client: legacyClient(config),
    path: { UID: uid },
  })
  return error ? { success: false, error: errorMessage(error) } : { success: true }
}
