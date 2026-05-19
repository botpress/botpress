import { z } from '@botpress/sdk'
import { ActionDef } from './types'

export const dataArraySchema = z.object({
  datasourceUid: z
    .string()
    .min(1, 'Datasource UID is required')
    .title('Datasource UID')
    .describe('UID of the Prometheus datasource to query'),
  query: z
    .string()
    .min(1, 'Query expression is required')
    .title('Query')
    .describe('PromQL expression to evaluate (e.g. rate(cpu_usage[5m]))'),
  reducer: z
    .enum(['last', 'mean', 'max', 'min'])
    .default('mean')
    .title('Reducer')
    .describe('Aggregation function applied to the query results over the evaluation period'),
  thresholdType: z
    .enum(['gt', 'lt', 'gte', 'lte'])
    .title('Threshold Type')
    .describe('Comparison operator for the threshold condition (gt = greater than, lt = less than)'),
  thresholdValue: z.number().title('Threshold Value').describe('Numeric value to compare against'),
})

export const alertRuleSchema = z.object({
  title: z.string().min(1, 'Title is required').title('Title').describe('Name of the alert rule'),
  folderUID: z
    .string()
    .min(1, 'Folder UID is required')
    .title('Folder UID')
    .describe('UID of the folder to create the alert rule in'),
  dashboardUid: z
    .string()
    .optional()
    .title('Dashboard UID')
    .describe('Dashboard UID to visually link the alert to a panel'),
  panelId: z.string().optional().title('Panel ID').describe('Panel ID string to visually link the alert to a panel'),
  dataArray: dataArraySchema.title('Query Config').describe('Datasource query and alerting condition configuration'),
  forDuration: z
    .string()
    .optional()
    .default('5m')
    .title('For Duration')
    .describe('How long the condition must be true before alerting (e.g. "5m")'),
  ruleGroup: z
    .string()
    .optional()
    .default('default')
    .title('Rule Group')
    .describe('Rule group name — groups rules that share the same evaluation interval'),
  labels: z
    .record(z.string())
    .optional()
    .title('Labels')
    .describe('Key-value labels used to route the alert (e.g. { severity: "critical" })'),
  noDataState: z
    .enum(['Alerting', 'NoData', 'OK'])
    .optional()
    .default('NoData')
    .title('No Data State')
    .describe('Alert state when the query returns no data'),
  execErrState: z
    .enum(['OK', 'Alerting', 'Error'])
    .optional()
    .default('Error')
    .title('Execution Error State')
    .describe('Alert state when the query returns an error'),
  isPaused: z.boolean().optional().title('Is Paused').describe('Whether the alert rule is paused'),
  keep_firing_for: z
    .string()
    .optional()
    .title('Keep Firing For')
    .describe('Duration to keep firing after the condition is no longer true (e.g. "5m")'),
  missingSeriesEvalsToResolve: z
    .number()
    .optional()
    .title('Missing Series Evals To Resolve')
    .describe('Number of consecutive evaluations with missing data before the alert resolves'),
  uid: z.string().optional().title('UID').describe('Optional custom UID for the alert rule'),
  botpressId: z
    .string()
    .optional()
    .title('Botpress ID')
    .describe('Arbitrary ID stored as a botpress_id label — returned on every alertFired event to identify the target'),
  notification_settings: z
    .object({
      receiver: z
        .string()
        .min(1, 'Receiver name is required')
        .title('Receiver')
        .describe('Name of the contact point to route alerts to directly'),
      group_by: z.array(z.string()).optional().title('Group By').describe('Labels to group alerts by'),
      group_wait: z
        .string()
        .optional()
        .title('Group Wait')
        .describe('Time to wait before sending the first notification (e.g. "30s")'),
      group_interval: z
        .string()
        .optional()
        .title('Group Interval')
        .describe('Interval between notifications for ongoing alerts (e.g. "5m")'),
      repeat_interval: z
        .string()
        .optional()
        .title('Repeat Interval')
        .describe('Interval before re-sending a notification (e.g. "4h")'),
      mute_time_intervals: z
        .array(z.string())
        .optional()
        .title('Mute Time Intervals')
        .describe('Named time intervals during which notifications are muted'),
      active_time_intervals: z
        .array(z.string())
        .optional()
        .title('Active Time Intervals')
        .describe('Named time intervals during which this policy is active'),
    })
    .optional()
    .title('Notification Settings')
    .describe('Wire the alert directly to a contact point, skipping notification policies'),
})

export const createAlertRule = {
  title: 'Create Alert Rule',
  description: 'Create a Grafana alert rule',
  input: { schema: alertRuleSchema },
  output: {
    schema: z.object({
      uid: z.string().title('UID').describe('UID of the created alert rule'),
    }),
  },
} satisfies ActionDef
