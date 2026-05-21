import { z } from '@botpress/sdk'
import { ActionDef } from './types'

export const queryMetrics = {
  title: 'Query Metrics',
  description: 'Run a PromQL query over a time range against a Prometheus datasource',
  input: {
    schema: z.object({
      datasourceUid: z
        .string()
        .min(1, 'Datasource UID is required')
        .title('Datasource UID')
        .describe('UID of the Prometheus datasource to query'),
      query: z
        .string()
        .min(1, 'PromQL expression is required')
        .title('Query')
        .describe('PromQL expression to evaluate (e.g. rate(http_requests_total[5m]))'),
      start: z
        .string()
        .min(1, 'Start time is required')
        .title('Start')
        .describe('Start time as Unix timestamp or RFC3339 (e.g. "now-1h")'),
      end: z
        .string()
        .min(1, 'End time is required')
        .title('End')
        .describe('End time as Unix timestamp or RFC3339 (e.g. "now")'),
      step: z.string().optional().title('Step').describe('Query resolution step (e.g. "60s", "5m"). Defaults to auto'),
    }),
  },
  output: {
    schema: z.object({
      data: z.any().title('Data').describe('Prometheus range query result'),
    }),
  },
} satisfies ActionDef
