import {
  grafanaDashboardK8sCreateDashboard,
  grafanaDashboardK8sDeleteDashboard,
  grafanaDashboardK8sGetDashboard,
  grafanaDashboardK8sListDashboard,
  grafanaDashboardK8sReplaceDashboard,
  GrafanaDashboardK8sComGithubGrafanaGrafanaAppsDashboardPkgApisDashboardV1Dashboard as K8sDashboard,
} from '../grafana-k8s-client'
import type { Panel } from '../types/GrafanaDashboard'
import { type GrafanaConfig, k8sClient } from './config'
import { errorMessage } from './utils'

type CreateDashboardInput = {
  uid: string
  title: string
  tags?: string[]
  timezone?: string
  editable?: boolean
  graphTooltip?: number
  time?: { from: string; to: string }
  timepicker?: unknown
  templating?: unknown
  annotations?: unknown
  refresh?: string
  schemaVersion?: number
  version?: number
  panels?: Partial<Panel>[]
  folderUid?: string
}

function buildK8sBody(
  uid: string,
  ns: string,
  spec: Record<string, unknown>,
  folderUid?: string,
  existingMeta?: K8sDashboard['metadata']
): K8sDashboard {
  return {
    apiVersion: 'dashboard.grafana.app/v1',
    kind: 'Dashboard',
    metadata: {
      ...existingMeta,
      name: uid,
      namespace: ns,
      annotations: {
        ...existingMeta?.annotations,
        ...(folderUid ? { 'grafana.app/folder': folderUid } : {}),
      },
    },
    spec,
    status: {},
  }
}

export async function createDashboard(
  config: GrafanaConfig,
  ns: string,
  request: CreateDashboardInput
): Promise<{ success: boolean; error?: string }> {
  const { folderUid, uid, ...rest } = request
  const spec = {
    uid,
    title: rest.title,
    tags: rest.tags ?? [],
    timezone: rest.timezone ?? 'browser',
    editable: rest.editable ?? true,
    graphTooltip: rest.graphTooltip ?? 0,
    time: rest.time ?? { from: 'now-6h', to: 'now' },
    timepicker: rest.timepicker ?? {},
    templating: rest.templating ?? { list: [] },
    annotations: rest.annotations ?? { list: [] },
    refresh: rest.refresh ?? '5s',
    schemaVersion: rest.schemaVersion ?? 41,
    version: rest.version ?? 1,
    panels: rest.panels ?? [],
  }
  const { error } = await grafanaDashboardK8sCreateDashboard({
    client: k8sClient(config),
    path: { namespace: ns },
    body: buildK8sBody(uid, ns, spec, folderUid),
  })
  return error ? { success: false, error: errorMessage(error) } : { success: true }
}

export async function editDashboard(
  config: GrafanaConfig,
  ns: string,
  dashboardUid: string,
  updates: Partial<CreateDashboardInput>
): Promise<{ success: boolean; error?: string }> {
  const { data: existing, error: getError } = await grafanaDashboardK8sGetDashboard({
    client: k8sClient(config),
    path: { namespace: ns, name: dashboardUid },
  })
  if (getError || !existing) return { success: false, error: errorMessage(getError) }

  const { folderUid, ...specUpdates } = updates
  const folderUidToUse = folderUid ?? existing.metadata.annotations?.['grafana.app/folder']
  const { error } = await grafanaDashboardK8sReplaceDashboard({
    client: k8sClient(config),
    path: { namespace: ns, name: dashboardUid },
    body: buildK8sBody(dashboardUid, ns, { ...existing.spec, ...specUpdates }, folderUidToUse, existing.metadata),
  })
  return error ? { success: false, error: errorMessage(error) } : { success: true }
}

export async function editDashboardPanel(
  config: GrafanaConfig,
  ns: string,
  dashboardUid: string,
  panelId: number,
  panel: Partial<Panel>
): Promise<{ success: boolean; error?: string }> {
  const { data: existing, error: getError } = await grafanaDashboardK8sGetDashboard({
    client: k8sClient(config),
    path: { namespace: ns, name: dashboardUid },
  })
  if (getError || !existing) return { success: false, error: errorMessage(getError) }

  const existingPanels: Partial<Panel>[] = (existing.spec as any)?.panels ?? []
  const panelIndex = existingPanels.findIndex((p) => p.id === panelId)
  if (panelIndex === -1) {
    return { success: false, error: `Panel with id ${panelId} not found in dashboard "${dashboardUid}"` }
  }

  const updatedPanels = existingPanels.map((p, i) => (i === panelIndex ? { ...p, ...panel, id: panelId } : p))
  const folderUid = existing.metadata.annotations?.['grafana.app/folder']
  const { error } = await grafanaDashboardK8sReplaceDashboard({
    client: k8sClient(config),
    path: { namespace: ns, name: dashboardUid },
    body: buildK8sBody(dashboardUid, ns, { ...existing.spec, panels: updatedPanels }, folderUid, existing.metadata),
  })
  return error ? { success: false, error: errorMessage(error) } : { success: true }
}

export async function getDashboard(
  config: GrafanaConfig,
  ns: string,
  dashboardUid: string
): Promise<{ success: boolean; data?: { dashboard: unknown; meta: unknown }; error?: string }> {
  const { data, error } = await grafanaDashboardK8sGetDashboard({
    client: k8sClient(config),
    path: { namespace: ns, name: dashboardUid },
  })
  if (error || !data) return { success: false, error: errorMessage(error) }
  return {
    success: true,
    data: {
      dashboard: data.spec,
      meta: { folderUid: data.metadata.annotations?.['grafana.app/folder'] },
    },
  }
}

export async function listDashboards(
  config: GrafanaConfig,
  ns: string
): Promise<{ success: boolean; data?: { name: string; title: string }[]; error?: string }> {
  const { data, error } = await grafanaDashboardK8sListDashboard({
    client: k8sClient(config),
    path: { namespace: ns },
  })
  if (error || !data) return { success: false, error: errorMessage(error) }
  const items = data.items.map((d) => ({
    name: d.metadata.name ?? '',
    title: String((d.spec as any)?.title ?? d.metadata.name ?? ''),
  }))
  return { success: true, data: items }
}

export async function deleteDashboard(
  config: GrafanaConfig,
  ns: string,
  dashboardUid: string
): Promise<{ success: boolean; error?: string }> {
  const { error } = await grafanaDashboardK8sDeleteDashboard({
    client: k8sClient(config),
    path: { namespace: ns, name: dashboardUid },
  })
  return error ? { success: false, error: errorMessage(error) } : { success: true }
}
