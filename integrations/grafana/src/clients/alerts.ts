import { z } from '@botpress/sdk'
import { alertRuleSchema } from '../../definitions/actions/create-alert-rule'
import {
  routeDeleteAlertRule,
  routeGetAlertRule,
  routeGetAlertRules,
  routePostAlertRule,
} from '../gen/grafana-legacy-client'
import { type GrafanaConfig, legacyClient } from './config'
import { errorMessage } from './utils'

type AlertRuleInput = z.infer<typeof alertRuleSchema>

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

export async function createAlertRule(
  config: GrafanaConfig,
  input: AlertRuleInput
): Promise<{ success: boolean; uid?: string; error?: string }> {
  const { data, error } = await routePostAlertRule({
    client: legacyClient(config),
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
  if (error || !data) return { success: false, error: errorMessage(error) }
  return { success: true, uid: data.uid }
}

export async function listAlertRules(config: GrafanaConfig): Promise<{
  success: boolean
  data?: { uid?: string; title?: string; ruleGroup?: string; folderUID?: string; labels?: Record<string, string> }[]
  error?: string
}> {
  const { data, error } = await routeGetAlertRules({ client: legacyClient(config) })
  if (error || !data) return { success: false, error: errorMessage(error) }
  const items = data.map((r) => ({
    uid: r.uid,
    title: r.title,
    ruleGroup: r.ruleGroup,
    folderUID: r.folderUID,
    labels: r.labels,
  }))
  return { success: true, data: items }
}

export async function getAlertRule(
  config: GrafanaConfig,
  uid: string
): Promise<{
  success: boolean
  data?: { uid?: string; title?: string; ruleGroup?: string; folderUID?: string; labels?: Record<string, string> }
  error?: string
}> {
  const { data, error } = await routeGetAlertRule({ client: legacyClient(config), path: { UID: uid } })
  if (error || !data) return { success: false, error: errorMessage(error) }
  return {
    success: true,
    data: {
      uid: data.uid,
      title: data.title,
      ruleGroup: data.ruleGroup,
      folderUID: data.folderUID,
      labels: data.labels,
    },
  }
}

export async function deleteAlertRule(
  config: GrafanaConfig,
  uid: string
): Promise<{ success: boolean; error?: string }> {
  const { error } = await routeDeleteAlertRule({
    client: legacyClient(config),
    path: { UID: uid },
  })
  return error ? { success: false, error: errorMessage(error) } : { success: true }
}
