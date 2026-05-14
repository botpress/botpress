import { z } from '@botpress/sdk'
import { ActionDef } from './types'

export const dataArraySchema = z.object({
  datasourceUid: z.string().min(1, 'Datasource UID is required'),
  query: z.string().min(1, 'Query expression is required (e.g. rate(cpu_usage[5m]))'),
  reducer: z.enum(['last', 'mean', 'max', 'min']).default('mean'),
  thresholdType: z.enum(['gt', 'lt', 'gte', 'lte']),
  thresholdValue: z.number(),
})

export const alertRuleSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  folderUID: z.string().min(1, 'Folder UID is required'),
  dashboardUid: z.string().optional().describe('Dashboard UID to visually link the alert to a panel'),
  panelId: z.string().optional().describe('Panel ID string to visually link the alert to a panel'),
  dataArray: dataArraySchema,
  forDuration: z.string().optional().default('5m').describe('How long the condition must be true before alerting'),
  ruleGroup: z.string().optional().default('default').describe('Rule group name'),
  labels: z.record(z.string()).optional().describe('Key-value labels used to route the alert (e.g. { severity: "critical" })'),
  noDataState: z.enum(['Alerting', 'NoData', 'OK']).optional().default('NoData'),
  execErrState: z.enum(['OK', 'Alerting', 'Error']).optional().default('Error'),
  isPaused: z.boolean().optional(),
  keep_firing_for: z.string().optional(),
  missingSeriesEvalsToResolve: z.number().optional(),
  uid: z.string().optional(),
  botpressId: z.string().optional().describe('Arbitrary ID stored as a botpress_id label on the rule — returned on every alertFired event'),
  notification_settings: z.object({
    receiver: z.string().min(1, 'Receiver name is required'),
    group_by: z.array(z.string()).optional(),
    group_wait: z.string().optional(),
    group_interval: z.string().optional(),
    repeat_interval: z.string().optional(),
    mute_time_intervals: z.array(z.string()).optional(),
    active_time_intervals: z.array(z.string()).optional(),
  }).optional().describe('Wire the alert directly to a contact point, skipping notification policies'),
})

export const createAlertRule = {
  title: 'Create Alert Rule',
  description: 'Create a Grafana alert rule',
  input: { schema: alertRuleSchema },
  output: {
    schema: z.object({
      success: z.boolean(),
      uid: z.string().optional(),
      error: z.string().optional(),
    }),
  },
} satisfies ActionDef
