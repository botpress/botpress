import { z } from '@botpress/sdk'
import { ActionDef } from './types'

export const queryMetrics = {
  title: 'Query Metrics',
  description: 'Run a PromQL query over a time range against a Prometheus datasource',
  input: {
    schema: z.object({
      datasourceUid: z.string().min(1, 'Datasource UID is required'),
      query: z.string().min(1, 'PromQL expression is required (e.g. rate(http_requests_total[5m]))'),
      start: z.string().min(1, 'Start time is required (Unix timestamp or RFC3339, e.g. "now-1h")'),
      end: z.string().min(1, 'End time is required (Unix timestamp or RFC3339, e.g. "now")'),
      step: z.string().optional().describe('Query resolution step (e.g. "60s", "5m"), defaults to auto'),
    }),
  },
  output: {
    schema: z.object({
      success: z.boolean(),
      data: z.any().optional(),
      error: z.string().optional(),
    }),
  },
} satisfies ActionDef
