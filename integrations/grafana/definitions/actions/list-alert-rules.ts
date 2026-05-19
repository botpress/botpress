import { z } from '@botpress/sdk'
import { ActionDef } from './types'

export const listAlertRules = {
  title: 'List Alert Rules',
  description: 'List all of you Grafana alert rules',
  input: { schema: z.object({}) },
  output: {
    schema: z.object({
      success: z.boolean(),
      data: z
        .array(
          z.object({
            uid: z.string().optional(),
            title: z.string().optional(),
            ruleGroup: z.string().optional(),
            folderUID: z.string().optional(),
            labels: z.record(z.string()).optional(),
          })
        )
        .optional(),
      error: z.string().optional(),
    }),
  },
} satisfies ActionDef
