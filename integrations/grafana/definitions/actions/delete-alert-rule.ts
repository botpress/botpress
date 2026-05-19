import { z } from '@botpress/sdk'
import { ActionDef } from './types'

export const deleteAlertRule = {
  title: 'Delete Alert Rule',
  description: 'Delete a Grafana alert rule by UID',
  input: {
    schema: z.object({
      uid: z.string().min(1, 'Alert rule UID is required').title('UID').describe('UID of the alert rule to delete'),
    }),
  },
  output: { schema: z.object({}) },
} satisfies ActionDef
