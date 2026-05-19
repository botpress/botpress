import { createClient, createConfig } from '../gen/grafana-k8s-client/client'
import {
  createClient as createLegacyClient,
  createConfig as createLegacyConfig,
} from '../gen/grafana-legacy-client/client'

export type GrafanaConfig = {
  grafanaUsername: string
  grafanaServiceAccountToken: string
}

export async function getK8sNamespace(config: GrafanaConfig): Promise<string> {
  const res = await fetch(`https://${config.grafanaUsername}.grafana.net/api/frontend/settings`, {
    headers: { Authorization: `Bearer ${config.grafanaServiceAccountToken}` },
  })
  if (!res.ok) throw new Error(`Failed to fetch Grafana namespace: ${res.status}`)
  const data = (await res.json()) as { namespace?: string }
  if (!data.namespace) throw new Error('Grafana did not return a namespace in /api/frontend/settings')
  return data.namespace
}

export function k8sClient(config: GrafanaConfig) {
  return createClient(
    createConfig({
      baseUrl: `https://${config.grafanaUsername}.grafana.net`,
      headers: { Authorization: `Bearer ${config.grafanaServiceAccountToken}` },
    })
  )
}

export function legacyClient(config: GrafanaConfig) {
  return createLegacyClient(
    createLegacyConfig({
      baseUrl: `https://${config.grafanaUsername}.grafana.net/api`,
      headers: { Authorization: `Bearer ${config.grafanaServiceAccountToken}` },
    })
  )
}
