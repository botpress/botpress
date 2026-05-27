import { z } from '@botpress/sdk'
import { alertRuleSchema } from '../definitions/actions/create-alert-rule'
import { createFolderSchema } from '../definitions/actions/create-folder'
import { matcherSchema, notificationPolicySchema } from '../definitions/notification-schemas'
import type { Panel } from '../grafana-api/GrafanaDashboard'
import {
  grafanaDashboardK8sCreateDashboard,
  grafanaDashboardK8sDeleteDashboard,
  grafanaDashboardK8sGetDashboard,
  grafanaDashboardK8sListDashboard,
  grafanaDashboardK8sReplaceDashboard,
  grafanaFolderK8sCreateFolder,
  grafanaFolderK8sDeleteFolder,
  grafanaFolderK8sListFolder,
  type GrafanaDashboardK8sComGithubGrafanaGrafanaAppsDashboardPkgApisDashboardV1Dashboard as K8sDashboard,
} from './gen/grafana-k8s-client'
import { createClient as createK8sClient, createConfig as createK8sConfig } from './gen/grafana-k8s-client/client'
import {
  getDataSources,
  routeDeleteAlertRule,
  routeGetAlertRule,
  routeGetAlertRules,
  routeGetContactpoints,
  routeDeleteContactpoints,
  routePostContactpoints,
  routeGetPolicyTree,
  routePutPolicyTree,
  routePostAlertRule,
  type Route,
} from './gen/grafana-legacy-client'
import {
  createClient as createLegacyClient,
  createConfig as createLegacyConfig,
} from './gen/grafana-legacy-client/client'

export type GrafanaConfig = {
  grafanaUsername: string
  grafanaServiceAccountToken: string
}

type AlertRuleInput = z.infer<typeof alertRuleSchema>
type CreateFolderInput = z.infer<typeof createFolderSchema>
type PolicyMatcher = z.infer<typeof matcherSchema>
type NotificationPolicyInput = z.infer<typeof notificationPolicySchema>

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

function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  if (typeof error === 'object' && error !== null) return JSON.stringify(error)
  return String(error)
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

function buildQueryData(
  datasourceUid: string,
  query: string,
  reducer: string,
  thresholdType: string,
  thresholdValue: number
): Record<string, any>[] {
  return [
    {
      refId: 'A',
      datasourceUid,
      queryType: '',
      relativeTimeRange: { from: 600, to: 0 },
      model: { expr: query, legendFormat: '', refId: 'A' },
    },
    {
      refId: 'B',
      datasourceUid: '__expr__',
      model: { type: 'reduce', refId: 'B', expression: 'A', reducer },
    },
    {
      refId: 'C',
      datasourceUid: '__expr__',
      model: {
        type: 'threshold',
        refId: 'C',
        expression: 'B',
        conditions: [{ evaluator: { type: thresholdType, params: [thresholdValue] } }],
      },
    },
  ]
}

function toObjectMatchers(matchers: PolicyMatcher[]): [string, string, string][] {
  return matchers.map((m) => [m.name, m.operator, m.value])
}

export class GrafanaClient {
  private readonly _k8s: ReturnType<typeof createK8sClient>
  private readonly _legacy: ReturnType<typeof createLegacyClient>
  private _namespace: string | undefined

  public constructor(private readonly _config: GrafanaConfig) {
    const baseUrl = `https://${_config.grafanaUsername}.grafana.net`
    const headers = { Authorization: `Bearer ${_config.grafanaServiceAccountToken}` }
    this._k8s = createK8sClient(createK8sConfig({ baseUrl, headers }))
    this._legacy = createLegacyClient(createLegacyConfig({ baseUrl: `${baseUrl}/api`, headers }))
  }

  public async namespace(): Promise<string> {
    if (this._namespace) return this._namespace
    const res = await fetch(`https://${this._config.grafanaUsername}.grafana.net/api/frontend/settings`, {
      headers: { Authorization: `Bearer ${this._config.grafanaServiceAccountToken}` },
    })
    if (!res.ok) throw new Error(`Failed to fetch Grafana namespace: ${res.status}`)
    const data = (await res.json()) as { namespace?: string }
    if (!data.namespace) throw new Error('Grafana did not return a namespace in /api/frontend/settings')
    this._namespace = data.namespace
    return this._namespace
  }

  // --- Dashboards ---

  public async createDashboard(request: CreateDashboardInput): Promise<void> {
    const ns = await this.namespace()
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
      client: this._k8s,
      path: { namespace: ns },
      body: buildK8sBody(uid, ns, spec, folderUid),
    })
    if (error) throw new Error(errorMessage(error))
  }

  public async editDashboard(dashboardUid: string, updates: Partial<CreateDashboardInput>): Promise<void> {
    const ns = await this.namespace()
    const { data: existing, error: getError } = await grafanaDashboardK8sGetDashboard({
      client: this._k8s,
      path: { namespace: ns, name: dashboardUid },
    })
    if (getError || !existing) throw new Error(errorMessage(getError))

    const { folderUid, ...specUpdates } = updates
    const folderUidToUse = folderUid ?? existing.metadata.annotations?.['grafana.app/folder']
    const { error } = await grafanaDashboardK8sReplaceDashboard({
      client: this._k8s,
      path: { namespace: ns, name: dashboardUid },
      body: buildK8sBody(dashboardUid, ns, { ...existing.spec, ...specUpdates }, folderUidToUse, existing.metadata),
    })
    if (error) throw new Error(errorMessage(error))
  }

  public async editDashboardPanel(dashboardUid: string, panelId: number, panel: Partial<Panel>): Promise<void> {
    const ns = await this.namespace()
    const { data: existing, error: getError } = await grafanaDashboardK8sGetDashboard({
      client: this._k8s,
      path: { namespace: ns, name: dashboardUid },
    })
    if (getError || !existing) throw new Error(errorMessage(getError))

    const existingPanels: Partial<Panel>[] = (existing.spec as any)?.panels ?? []
    const panelIndex = existingPanels.findIndex((p) => p.id === panelId)
    if (panelIndex === -1) throw new Error(`Panel with id ${panelId} not found in dashboard "${dashboardUid}"`)

    const updatedPanels = existingPanels.map((p, i) => (i === panelIndex ? { ...p, ...panel, id: panelId } : p))
    const folderUid = existing.metadata.annotations?.['grafana.app/folder']
    const { error } = await grafanaDashboardK8sReplaceDashboard({
      client: this._k8s,
      path: { namespace: ns, name: dashboardUid },
      body: buildK8sBody(dashboardUid, ns, { ...existing.spec, panels: updatedPanels }, folderUid, existing.metadata),
    })
    if (error) throw new Error(errorMessage(error))
  }

  public async getDashboard(dashboardUid: string): Promise<{ dashboard: unknown; meta: unknown }> {
    const ns = await this.namespace()
    const { data, error } = await grafanaDashboardK8sGetDashboard({
      client: this._k8s,
      path: { namespace: ns, name: dashboardUid },
    })
    if (error || !data) throw new Error(errorMessage(error))
    return {
      dashboard: data.spec,
      meta: { folderUid: data.metadata.annotations?.['grafana.app/folder'] },
    }
  }

  public async listDashboards(): Promise<{ name: string; title: string }[]> {
    const ns = await this.namespace()
    const { data, error } = await grafanaDashboardK8sListDashboard({
      client: this._k8s,
      path: { namespace: ns },
    })
    if (error || !data) throw new Error(errorMessage(error))
    return data.items.map((d) => ({
      name: d.metadata.name ?? '',
      title: String((d.spec as any)?.title ?? d.metadata.name ?? ''),
    }))
  }

  public async deleteDashboard(dashboardUid: string): Promise<void> {
    const ns = await this.namespace()
    const { error } = await grafanaDashboardK8sDeleteDashboard({
      client: this._k8s,
      path: { namespace: ns, name: dashboardUid },
    })
    if (error) throw new Error(errorMessage(error))
  }

  // --- Folders ---

  public async createFolder(input: CreateFolderInput): Promise<{ uid: string }> {
    const ns = await this.namespace()
    const { data, error } = await grafanaFolderK8sCreateFolder({
      client: this._k8s,
      path: { namespace: ns },
      body: {
        metadata: {
          namespace: ns,
          ...(input.uid ? { name: input.uid } : { generateName: 'f-' }),
          ...(input.parentUid ? { labels: { 'grafana.app/folder': input.parentUid } } : {}),
        },
        spec: {
          title: input.title,
          ...(input.description ? { description: input.description } : {}),
        },
      },
    })
    if (error || !data) throw new Error(errorMessage(error))
    return { uid: data.metadata.name ?? '' }
  }

  public async listFolders(): Promise<{ uid?: string; title?: string; parentUid?: string }[]> {
    const ns = await this.namespace()
    const { data, error } = await grafanaFolderK8sListFolder({
      client: this._k8s,
      path: { namespace: ns },
    })
    if (error || !data) throw new Error(errorMessage(error))
    return data.items.map((f) => ({
      uid: f.metadata.name,
      title: f.spec.title,
      parentUid: f.metadata.labels?.['grafana.app/folder'],
    }))
  }

  public async deleteFolder(folderUid: string): Promise<void> {
    const ns = await this.namespace()
    const { error } = await grafanaFolderK8sDeleteFolder({
      client: this._k8s,
      path: { namespace: ns, name: folderUid },
    })
    if (error) throw new Error(errorMessage(error))
  }

  // --- Alert Rules ---

  public async createAlertRule(input: AlertRuleInput): Promise<{ uid: string }> {
    const { data, error } = await routePostAlertRule({
      client: this._legacy,
      body: {
        title: input.title,
        folderUID: input.folderUID,
        ruleGroup: input.ruleGroup,
        condition: 'C',
        data: buildQueryData(
          input.dataArray.datasourceUid,
          input.dataArray.query,
          input.dataArray.reducer,
          input.dataArray.thresholdType,
          input.dataArray.thresholdValue
        ) as any,
        for: input.forDuration,
        labels: { ...(input.botpressId ? { botpress_id: input.botpressId } : {}), ...input.labels },
        annotations:
          input.dashboardUid && input.panelId
            ? { __dashboardUid__: input.dashboardUid, __panelId__: input.panelId }
            : undefined,
        noDataState: input.noDataState,
        execErrState: input.execErrState,
        orgID: 1,
        isPaused: input.isPaused,
        keep_firing_for: input.keep_firing_for,
        missingSeriesEvalsToResolve: input.missingSeriesEvalsToResolve,
        uid: input.uid,
        notification_settings: input.notification_settings,
      },
    })
    if (error || !data) throw new Error(errorMessage(error))
    return { uid: data.uid ?? '' }
  }

  public async listAlertRules(): Promise<
    { uid?: string; title?: string; ruleGroup?: string; folderUID?: string; labels?: Record<string, string> }[]
  > {
    const { data, error } = await routeGetAlertRules({ client: this._legacy })
    if (error || !data) throw new Error(errorMessage(error))
    return data.map((r) => ({
      uid: r.uid,
      title: r.title,
      ruleGroup: r.ruleGroup,
      folderUID: r.folderUID,
      labels: r.labels,
    }))
  }

  public async getAlertRule(uid: string): Promise<{
    uid?: string
    title?: string
    ruleGroup?: string
    folderUID?: string
    labels?: Record<string, string>
  }> {
    const { data, error } = await routeGetAlertRule({ client: this._legacy, path: { UID: uid } })
    if (error || !data) throw new Error(errorMessage(error))
    return {
      uid: data.uid,
      title: data.title,
      ruleGroup: data.ruleGroup,
      folderUID: data.folderUID,
      labels: data.labels,
    }
  }

  public async deleteAlertRule(uid: string): Promise<void> {
    const { error } = await routeDeleteAlertRule({ client: this._legacy, path: { UID: uid } })
    if (error) throw new Error(errorMessage(error))
  }

  // --- Notification Policies ---

  public async createNotificationPolicy(input: NotificationPolicyInput): Promise<void> {
    const { data: tree, error: getError } = await routeGetPolicyTree({ client: this._legacy })
    if (getError || !tree) throw new Error(errorMessage(getError))

    const { error } = await routePutPolicyTree({
      client: this._legacy,
      body: {
        ...tree,
        routes: [
          ...(tree.routes ?? []),
          {
            receiver: input.receiver,
            continue: input.continue,
            group_by: input.group_by,
            group_wait: input.group_wait,
            group_interval: input.group_interval,
            repeat_interval: input.repeat_interval,
            mute_time_intervals: input.mute_time_intervals,
            active_time_intervals: input.active_time_intervals,
            object_matchers: input.matchers ? toObjectMatchers(input.matchers) : undefined,
          },
        ],
      },
    })
    if (error) throw new Error(errorMessage(error))
  }

  public async listNotificationPolicies(): Promise<
    { receiver?: string; matchers?: unknown; object_matchers?: unknown; group_by?: string[]; continue?: boolean }[]
  > {
    const { data: tree, error } = await routeGetPolicyTree({ client: this._legacy })
    if (error || !tree) throw new Error(errorMessage(error))
    return (tree.routes ?? []).map((r) => ({
      receiver: r.receiver,
      matchers: r.matchers,
      object_matchers: r.object_matchers,
      group_by: r.group_by,
      continue: r.continue,
    }))
  }

  public async editNotificationPolicy(input: {
    receiver: string
    matchers: PolicyMatcher[]
    updates: Partial<NotificationPolicyInput>
  }): Promise<void> {
    const { data: tree, error: getError } = await routeGetPolicyTree({ client: this._legacy })
    if (getError || !tree) throw new Error(errorMessage(getError))

    const inputTuples = JSON.stringify(toObjectMatchers(input.matchers))
    const isMatch = (r: Route) => r.receiver === input.receiver && JSON.stringify(r.object_matchers) === inputTuples

    const routes = tree.routes ?? []
    if (!routes.some(isMatch)) {
      throw new Error(`No notification policy found for receiver "${input.receiver}" with the given matchers`)
    }

    const { error } = await routePutPolicyTree({
      client: this._legacy,
      body: {
        ...tree,
        routes: routes.map((r) =>
          isMatch(r)
            ? {
                ...r,
                receiver: input.updates.receiver ?? r.receiver,
                object_matchers: input.updates.matchers ? toObjectMatchers(input.updates.matchers) : r.object_matchers,
                continue: input.updates.continue ?? r.continue,
                group_by: input.updates.group_by ?? r.group_by,
                group_wait: input.updates.group_wait ?? r.group_wait,
                group_interval: input.updates.group_interval ?? r.group_interval,
                repeat_interval: input.updates.repeat_interval ?? r.repeat_interval,
                mute_time_intervals: input.updates.mute_time_intervals ?? r.mute_time_intervals,
                active_time_intervals: input.updates.active_time_intervals ?? r.active_time_intervals,
              }
            : r
        ),
      },
    })
    if (error) throw new Error(errorMessage(error))
  }

  public async editDefaultNotificationPolicy(input: Partial<Omit<NotificationPolicyInput, 'matchers'>>): Promise<void> {
    const { data: tree, error: getError } = await routeGetPolicyTree({ client: this._legacy })
    if (getError || !tree) throw new Error(errorMessage(getError))

    const { error } = await routePutPolicyTree({
      client: this._legacy,
      body: {
        ...tree,
        ...(input.receiver !== undefined && { receiver: input.receiver }),
        ...(input.group_by !== undefined && { group_by: input.group_by }),
        ...(input.group_wait !== undefined && { group_wait: input.group_wait }),
        ...(input.group_interval !== undefined && { group_interval: input.group_interval }),
        ...(input.repeat_interval !== undefined && { repeat_interval: input.repeat_interval }),
        ...(input.mute_time_intervals !== undefined && { mute_time_intervals: input.mute_time_intervals }),
        ...(input.active_time_intervals !== undefined && { active_time_intervals: input.active_time_intervals }),
      },
    })
    if (error) throw new Error(errorMessage(error))
  }

  public async deleteNotificationPolicy(input: { receiver: string; matchers: PolicyMatcher[] }): Promise<void> {
    const { data: tree, error: getError } = await routeGetPolicyTree({ client: this._legacy })
    if (getError || !tree) throw new Error(errorMessage(getError))

    const inputTuples = JSON.stringify(toObjectMatchers(input.matchers))
    const isMatch = (r: Route) => r.receiver === input.receiver && JSON.stringify(r.object_matchers) === inputTuples

    const routes = tree.routes ?? []
    if (!routes.some(isMatch)) {
      throw new Error(`No notification policy found for receiver "${input.receiver}" with the given matchers`)
    }

    const { error } = await routePutPolicyTree({
      client: this._legacy,
      body: { ...tree, routes: routes.filter((r) => !isMatch(r)) },
    })
    if (error) throw new Error(errorMessage(error))
  }

  // --- Contact Points ---

  public async listContactPoints(): Promise<{ uid?: string; name?: string; type: string }[]> {
    const { data, error } = await routeGetContactpoints({ client: this._legacy })
    if (error || !data) throw new Error(errorMessage(error))
    return data.map((cp) => ({ uid: cp.uid, name: cp.name, type: cp.type }))
  }

  public async createContactPoint(input: { webhookUrl: string; secret: string; name?: string }): Promise<{
    uid: string
  }> {
    const { data, error } = await routePostContactpoints({
      client: this._legacy,
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
    if (error || !data) throw new Error(errorMessage(error))
    return { uid: data.uid ?? '' }
  }

  public async deleteContactPoint(uid: string): Promise<void> {
    const { error } = await routeDeleteContactpoints({ client: this._legacy, path: { UID: uid } })
    if (error) throw new Error(errorMessage(error))
  }

  // --- Datasources ---

  public async listDatasources(): Promise<{ uid?: string; name?: string; type?: string; isDefault?: boolean }[]> {
    const { data, error } = await getDataSources({ client: this._legacy })
    if (error || !data) throw new Error(errorMessage(error))
    return data.map((ds) => ({ uid: ds.uid, name: ds.name, type: ds.type, isDefault: ds.isDefault }))
  }

  private async _prometheusProxy(datasourceUid: string, path: string, params?: Record<string, string>): Promise<any> {
    const url = new URL(
      `https://${this._config.grafanaUsername}.grafana.net/api/datasources/proxy/uid/${datasourceUid}/${path}`
    )
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        url.searchParams.set(key, value)
      }
    }
    const response = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${this._config.grafanaServiceAccountToken}` },
    })
    if (!response.ok) throw new Error(`Prometheus proxy error ${response.status}: ${await response.text()}`)
    const json = (await response.json()) as { data?: unknown }
    return json.data
  }

  public async queryMetrics(
    datasourceUid: string,
    query: string,
    start: string,
    end: string,
    step?: string
  ): Promise<any> {
    return this._prometheusProxy(datasourceUid, 'api/v1/query_range', {
      query,
      start,
      end,
      ...(step ? { step } : {}),
    })
  }

  public async listMetricNames(datasourceUid: string): Promise<string[]> {
    return this._prometheusProxy(datasourceUid, 'api/v1/label/__name__/values')
  }

  public async listLabelNames(datasourceUid: string): Promise<string[]> {
    return this._prometheusProxy(datasourceUid, 'api/v1/labels')
  }

  public async listLabelValues(datasourceUid: string, labelName: string): Promise<string[]> {
    return this._prometheusProxy(datasourceUid, `api/v1/label/${encodeURIComponent(labelName)}/values`)
  }
}
