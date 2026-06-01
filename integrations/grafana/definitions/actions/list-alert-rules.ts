import { z } from '@botpress/sdk'
import { ActionDef } from './types'

export const listAlertRules = {
  title: 'List Alert Rules',
  description: 'List all Grafana alert rules',
  input: { schema: z.object({}) },
  output: {
    schema: z.object({
      alertRules: z
        .array(
          z.object({
            uid: z.string().optional().title('UID').describe('Alert rule UID'),
            title: z.string().optional().title('Title').describe('Alert rule name'),
            ruleGroup: z.string().optional().title('Rule Group').describe('Rule group this alert belongs to'),
            folderUID: z.string().optional().title('Folder UID').describe('UID of the containing folder'),
            labels: z.record(z.string()).optional().title('Labels').describe('Key-value labels on the alert rule'),
          })
        )
        .title('Alert Rules')
        .describe('List of all alert rules'),
    }),
  },
} satisfies ActionDef
