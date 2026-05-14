import { z } from '@botpress/sdk'
import { ActionDef } from './types'

export const getAlertRule = {
  title: 'Get Alert Rule',
  description: 'Get a Grafana alert rule by UID',
  input: {
    schema: z.object({
      uid: z.string(),
    }),
  },
  output: {
    schema: z.object({
      success: z.boolean(),
      data: z.object({
        uid: z.string().optional(),
        title: z.string().optional(),
        ruleGroup: z.string().optional(),
        folderUID: z.string().optional(),
        labels: z.record(z.string()).optional(),
      }).optional(),
      error: z.string().optional(),
    }),
  },
} satisfies ActionDef
