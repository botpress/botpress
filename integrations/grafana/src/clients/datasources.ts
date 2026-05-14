import { getDataSources } from '../grafana-legacy-client'
import { type GrafanaConfig, legacyClient } from './config'

function errorMessage(error: unknown): string {
  return typeof error === 'object' ? JSON.stringify(error) : String(error)
}

async function prometheusProxy(
  config: GrafanaConfig,
  datasourceUid: string,
  path: string,
  params?: Record<string, string>
): Promise<{ success: boolean; data?: any; status?: number; error?: string }> {
  const url = new URL(`https://${config.grafanaUsername}.grafana.net/api/datasources/proxy/uid/${datasourceUid}/${path}`)

  if (params) {
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value)
    }
  }

  try {
    const response = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${config.grafanaServiceAccountToken}` },
    })

    if (!response.ok) {
      return { success: false, status: response.status, error: await response.text() }
    }

    const json = await response.json() as { data?: unknown }
    return { success: true, status: response.status, data: json.data }
  } catch (error) {
    return { success: false, error: String(error) }
  }
}


export async function listDatasources(
  config: GrafanaConfig
): Promise<{ success: boolean; data?: { uid?: string; name?: string; type?: string; isDefault?: boolean }[]; error?: string }> {
  const { data, error } = await getDataSources({ client: legacyClient(config) })
  if (error || !data) return { success: false, error: errorMessage(error) }
  const items = data.map((ds) => ({ uid: ds.uid, name: ds.name, type: ds.type, isDefault: ds.isDefault }))
  return { success: true, data: items }
}

export async function queryMetrics(
  config: GrafanaConfig,
  datasourceUid: string,
  query: string,
  start: string,
  end: string,
  step?: string
): Promise<{ success: boolean; data?: any; error?: string }> {
  return prometheusProxy(config, datasourceUid, 'api/v1/query_range', {
    query,
    start,
    end,
    ...(step ? { step } : {}),
  })
}

export async function listMetricNames(
  config: GrafanaConfig,
  datasourceUid: string
): Promise<{ success: boolean; data?: string[]; error?: string }> {
  return prometheusProxy(config, datasourceUid, 'api/v1/label/__name__/values')
}

export async function listLabelNames(
  config: GrafanaConfig,
  datasourceUid: string
): Promise<{ success: boolean; data?: string[]; error?: string }> {
  return prometheusProxy(config, datasourceUid, 'api/v1/labels')
}

export async function listLabelValues(
  config: GrafanaConfig,
  datasourceUid: string,
  labelName: string
): Promise<{ success: boolean; data?: string[]; error?: string }> {
  return prometheusProxy(config, datasourceUid, `api/v1/label/${labelName}/values`)
}
